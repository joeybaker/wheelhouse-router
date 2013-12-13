'use strict';

var app
  , fs = require('fs')
  , _ = require('lodash')
  , path = require('path')
  , internals = {}
  _.str = require('underscore.string')

/* utility functions
*/

// call with the route context
internals.respondWithError = function respondWithError(status, meta){
  meta || (meta = {})
  // attach the user to the logs
  if (_.has(this.req, 'user')) meta.user = this.req.user.id
  if (!meta.stack) meta.stack = new Error().stack.split('\n')

  app.log.warn('router: ' + status + ': ' + this.req.url, meta)
  this.res.writeHead(status, { 'Content-Type': 'text/html'} )

  if (internals.options.err[status]){
    this.res.end(internals.options.render(internals.options.err[status]))
  }
  else
    this.res.end('' + status)
}

// call with the route context
internals.getRequestUserJSON = function getRequestUserJSON(){
  return _.has(this.req, 'user')
    ? this.req.user.toJSON
      ? this.req.user.toJSON()
      : this.req.user
    : undefined
}

// call with the route context
internals.parseControllerMethod = function(controller, method, collection, model){
  if (_.isFunction(controller[method])){
    try {
      return controller[method].call(this, collection)
    }
    catch (e){
      app.log.error('router: building template: ' + method + ' method:', {
        url: this.req.url
        , user: _.has(this.req, 'user') ? this.req.user.id : undefined
        , stack: e.stack.split('\n')
      })
      internals.respondWithError.call(this, 500)
      throw e
    }
  }
  else {
    return _.isObject(controller[method])
      ? controller[method]
      // else if we have a model, use that
      : model
        ? model
        // else if we have a collection use that
        : collection
          ? collection.toJSON()
          : undefined
  }
}

/* routing functions
*/

internals.buildTemplate = function buildTemplate(context, params, collection){
  var opts
    , modelObject
    , model
    , data
    , bootstrap
    , user

  opts = _.defaults((params || {}), {
    data: null
    , bootstrap: null
    , title: ''
    , meta: {}
  })
  modelObject = _.isFunction(opts.model)
    ? opts.model.call(context, collection)
    : false
  model = modelObject && modelObject.toJSON
    ? modelObject.toJSON()
    : _.isObject(opts.model)
      ? opts.model
      : undefined

  data = internals.parseControllerMethod.call(context, opts, 'data', collection, model)
  bootstrap = internals.parseControllerMethod.call(context, opts, 'bootstrap', collection, model)
  user = internals.getRequestUserJSON.call(context)

  return internals.options.render(opts.template || opts.view, _.extend(data || {}, (user ? {_user: user} : {})), {
      _data: bootstrap
      , title: opts.title
      , meta: opts.meta
      , user: user
    })
}

// deal with the results of a controller returning an object for templates
internals.render = function render(context, params){
  var Collection
    , collection
    , done = function(body){
      // it's possible that server-side routes will set their own headers
      // access the raw response object b/c flatiron is silly
      if (!context.res.response.headersSent){
        context.res.writeHead(200, {
          'Content-Length': body.length || 0
          , 'Content-Type': 'text/html'
        })
      }
      context.res.end(body)
    }

  if (params && app.collections && app.collections[params.collection])
    done(internals.buildTemplate(context, params, app.collections[params.collection]))
  else if (params && params.collection){
    Collection = (params && params.collection) ? require(path.join(internals.options.collections || '', params.collection || '')) : false
    collection = Collection ? new Collection() : false

    collection.fetch({
      error: app.log.error
      , success: function(){
        done(internals.buildTemplate(context, params, collection))
      }
    })
  }
  else
    done(internals.buildTemplate(context, params))
}

// called when attached to the app. Matches routes to controllers
internals.mountRoutes = function mountRoutes(routes){
  _.each(routes, function(processes, pathPattern){
    // the backbone router interprets `()` as optional, so we'll make it so here too.
    var pathPatternParsed = pathPattern.replace(')', ')?')

    _.each(processes, function(controllerAction, method){
      var controllerActionParts = controllerAction.split('#')
        , controller = controllerActionParts[0]
        , action = controllerActionParts[1] || method
        , controllerPath = path.join(internals.options.controllers, controller)
        , serverControllerPath = controllerPath + 'Server.js'
        , hasServer = fs.existsSync(serverControllerPath)
        , methodParsed = /^[0-9]/.test(method) ? parseInt(method, 10) : method
        , mutual = _.isNumber(methodParsed) ? true : require(controllerPath)[action]
        , server = hasServer ? require(serverControllerPath)[action] : false

      if (!mutual) throw new Error(action + ' doesn\'t exist on the ' + controller + ' controller.')

      app.router.on(mutual === true ? 'get' : method, pathPatternParsed, function(){
        var self = this
          , args = _.values(arguments)
          , done = function(){
            internals.render(self, mutual.apply(self, args))
          }

        if (_.isFunction(internals.options.permissions) && !internals.options.permissions.call(this, method, pathPattern)) {
          internals.respondWithError.call(this, 403)
          return false
        }

        if (args.length === 1 && _.isUndefined(args[0])) args = []

        // server only route
        if (server) server.apply(self, args.length ? args.push(done) : [done])
        // we're actually dealing with a redirect here.
        else if (mutual === true) {
          this.res.writeHead(methodParsed, {'Location': controllerAction, 'Content-Length': '0'})
          this.res.end()
        }
        // normal route that should return HTML
        else done()
      })
    })
  })
}

exports.internals = internals

exports.name = 'routerPlugin'

exports.attach = function(opts){
  var paths
  app = this
  paths = app.config.get('paths') || {}

  opts = _.defaults(opts, {
    collections: paths.collections
    , controllers: paths.controllers
    , base: app._base
    , err: {}
    , render: app.render || function(view, data, opts){
      return 'Router would like to do the following: \n' + JSON.stringify({view: view, data: data, opts: opts}) + '\n\nYou need to specify a render method in the router options, or set app.render.'
    }
    , before: []
    , on: []
    , permissions: null
  })
  internals.options = _.extend(opts, {
    collections: opts.collections ? path.join(opts.base || process.cwd(), opts.collections) : null
    , controllers: opts.controllers ? path.join(opts.base || process.cwd(), opts.controllers) : null
  })

  internals.mountRoutes(_.extend({}, internals.options.mutualRoutes, internals.options.serverRoutes))

  app.router.configure({
    before: [
      function(){
        var user = _.has(this.req, 'isAuthenticated') && _.has(this.req, 'user') && this.req.isAuthenticated() && _.isFunction(this.req.user.get)
          ? ': ' + this.req.user.get('email') + ':'
          : ''

        app.log.info('router: ' + this.req.method + user, this.req.url)
      }
      , function(){
        this.app = app
      }
    ].concat(internals.options.before)
    , on: internals.options.on
    , notfound: function() {
      internals.respondWithError.call(this, 404)
    }
    , strict: false
    , recurse: 'forward'
  })
  app.router.render = internals.render
}
