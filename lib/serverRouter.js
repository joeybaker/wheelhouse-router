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
    , data = _.isFunction(opts.data)
      ? opts.data.call(context, collection)
      : opts ? opts.data : undefined
    , bootstrap = _.isFunction(opts.bootstrap)
      ? opts.data.call(context, collection)
      : opts ? opts.bootstrap : data
    , sendRes = function(){
      context.res.end(options.render(opts.view, data, {
        _data: bootstrap
        , title: opts.title
        , meta: opts.meta
      }))
    }

  // reparse templates in devel so that we're not looking at stale data
  if (app.env === 'development' && app.parseTemplates) app.parseTemplates(sendRes)
  else sendRes()
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
    _.each(processes, function(controllerAction, method){
      var controllerActionParts = controllerAction.split('#')
        , controller = controllerActionParts[0]
        , action = controllerActionParts[1] || method
        // the backbone router interprets `()` as optional, so we'll make it so here too.
        , pathPatternParsed = pathPattern.replace(')', ')?')
        , controllerPath = path.join(options.controllers, controller)
        , serverControllerPath = controllerPath + 'Server.js'
        , hasServer = fs.existsSync(serverControllerPath)
        , mutual = require(controllerPath)[action]
        , server = hasServer ? require(serverControllerPath)[action] : false

      app.router.on(method, pathPatternParsed, function(){
        var self = this
          , args = _.values(arguments)
          , done = function(){
            render(self, mutual.apply(self, args))
          }
        if (args.length === 1 && _.isUndefined(args[0])) args = []

        if (server) server.apply(self, args.length ? args.push(done) : [done])
        else done()
      })
    })
  })
}

exports.name = 'routerPlugin'

exports.attach = function(opts){
  var paths
  app = this
  paths = app.config.get('paths')

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
    mutualRoutes: require(path.join(opts.base, opts.mutualRoutes))
    , serverRoutes: require(path.join(opts.base, opts.serverRoutes))
    , collections: path.join(opts.base, opts.collections)
    , controllers: path.join(opts.base, opts.controllers)
  })

  mountRoutes(_.extend({}, options.mutualRoutes, options.serverRoutes))

  app.router.configure({
    before: [
      function(){
        app.log.info('route: ' + this.req.url)
      }
      , function(){
        this.app = app
      }
    ]
    , on: []
    , notfound: function(err) {
      if(err) {
        app.log.warn('404: ' + this.req.url)
        this.res.writeHead(404, { 'Content-Type': 'text/html'} )
        this.res.end(options.render(options.err404))
      }
    }
    , strict: false
    , recurse: 'forward'
  })
}

