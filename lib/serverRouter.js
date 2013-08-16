'use strict';
var app
  , options
  , fs = require('fs')
  , _ = require('lodash')
  , path = require('path')
  _.str = require('underscore.string')

function buildTemplate(context, params, collection){
  var opts = _.defaults((params || {}), {
      data: null
      , bootstrap: null
      , title: ''
      , meta: {}
    })
    , modelObject = _.isFunction(opts.model)
      ? opts.model.call(context, collection)
      : false
    , model = modelObject && modelObject.toJSON
      ? modelObject.toJSON()
      : _.isObject(opts.model)
        ? opts.model
        : undefined
    // if the data opt is defined, call it
    , data = _.isFunction(opts.data)
      ? opts.data.call(context, collection)
      // else, if it's an object, just use it
      : _.isObject(opts.data)
        ? opts.data
        // else if we have a model, use that
        : model
          ? model
          // else if we have a collection use that
          : collection
            ? collection.toJSON()
            : undefined
    // if the boostrap function is defined, call it
    , bootstrap = _.isFunction(opts.bootstrap)
      ? opts.bootstrap.call(context, collection)
      // else if it's an object, use it
      : _.isObject(opts.bootstrap)
        ? opts.bootstrap
        // else if we have a model, create it and use that
         : model
            ? model
            // else if we have a collection, use that
            : collection
              ? collection.toJSON()
              : undefined
    , sendRes = function(){
      var body = options.render(opts.view, data, {
        _data: bootstrap
        , title: opts.title
        , meta: opts.meta
        , user: _.has(context.req, 'user')
          ? _.has(context.req.user, 'toJSON')
            ? context.req.user.toJSON()
            : context.req.user
          : undefined
      })
      // TODO: this doesn't play nicely yet with the server controllers modifying input
      // context.res.writeHead(200, {
      //   'Content-Length': body.length || 0
      //   , 'Content-Type': 'text/html'
      // })
      context.res.end(body)
    }

  sendRes()
}

// deal with the results of a controller returning an object for templates
function render(context, params){
  var self = context
    , Collection = (params && params.collection) ? require(path.join(options.collections, params.collection)) : false
    , collection = Collection ? new Collection() : false

  // fetch the collection on every request so that we always have fresh data.
  // TODO: use the changes feed to eliminate that step
  if (collection) collection.fetch({
    error: app.log.error
    , success: function(){
      buildTemplate(self, params, collection)
    }
  })
  else buildTemplate(self, params)
}

// called when attached to the app. Matches routes to controllers
function mountRoutes(routes){
  _.each(routes, function(processes, pathPattern){
    // the backbone router interprets `()` as optional, so we'll make it so here too.
    var pathPatternParsed = pathPattern.replace(')', ')?')

    _.each(processes, function(controllerAction, method){
      var controllerActionParts = controllerAction.split('#')
        , controller = controllerActionParts[0]
        , action = controllerActionParts[1] || method
        , controllerPath = path.join(options.controllers, controller)
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
            render(self, mutual.apply(self, args))
          }

        if (args.length === 1 && _.isUndefined(args[0])) args = []

        if (server) server.apply(self, args.length ? args.push(done) : [done])
        // we're actually dealing with a redirect here.
        else if (mutual === true) {
          this.res.writeHead(methodParsed, {'Location': controllerAction, 'Content-Length': '0'})
          this.res.end()
        }
        else done()
      })
    })
  })
}

exports.name = 'routerPlugin'

exports.attach = function(opts){
  var paths
  app = this
  paths = app.config.get('paths') || {}

  _.defaults(opts , {
    mutualRoutes: paths.mutualRoutes
    , serverRoutes: paths.serverRoutes
    , collections: paths.collections
    , controllers: paths.controllers
    , base: app._base
    , err404: 'err/404'
    , render: app.render || function(view, data, opts){
      return 'Router would like to do the following: \n' + JSON.stringify({view: view, data: data, opts: opts}) + '\n\nYou need to specify a render method in the router options, or set app.render.'
    }
  })
  options = _.extend(opts, {
    mutualRoutes: opts.mutualRoutes ? require(path.join(opts.base || process.cwd(), opts.mutualRoutes)) : null
    , serverRoutes: opts.serverRoutes ? require(path.join(opts.base || process.cwd(), opts.serverRoutes)) : null
    , collections: opts.collections ? path.join(opts.base || process.cwd(), opts.collections) : null
    , controllers: opts.controllers ? path.join(opts.base || process.cwd(), opts.controllers) : null
  })

  mountRoutes(_.extend({}, options.mutualRoutes, options.serverRoutes))

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
    ]
    , on: []
    , notfound: function(err) {
      if (err) {
        app.log.warn('router: 404: ' + this.req.url)
        this.res.writeHead(404, { 'Content-Type': 'text/html'} )
        this.res.end(options.render(options.err404))
      }
    }
    , strict: false
    , recurse: 'forward'
  })
  app.router.render = render
}
