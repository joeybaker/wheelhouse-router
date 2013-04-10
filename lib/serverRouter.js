'use strict';
var app
  , options
  , _ = require('lodash')
  , path = require('path')
  _.str = require('underscore.string')

function getViewData(context, collection, data){
  var result
  if (_.isFunction(data)) result = data.call(context, collection)
  if (_.isPlainObject(data) || _.isArray(data)) result = data

  return _.has(result, 'toJSON') ? result.toJSON() : result
}

function render(context, view, collection, opts){
  var data = getViewData(context, collection, opts.data)

  // reparse templates in devel so that we're not looking at stale data
  if (app.env === 'development' && app.parseTemplates) {
    app.parseTemplates(function(){
      context.res.end(options.render(view, data, {_data: data}))
    })
  }
  else context.res.end(options.render(view, data, {_data: data}))
}

function getView(context, view, collectionName, collectionParse){
  var self = context
    , Collection = collectionName ? require(options.collections + collectionName) : false
    , collection = Collection ? new Collection() : false

  if (collection) collection.fetch({
    success: function(){
      render(context, view, collection, collectionParse)
    }
    , error: app.log.error
  })
  else self.res.end(options.render(view))
}

function mountRoutes(router, routes){
  _.each(routes, function(actions, path){
    _.each(actions, function(action, method){
      var actionParts = action.split('#')
        , controller = actionParts[0]
        , fn = actionParts[1] || method
        // the backbone router interprets `()` as optional, so we'll make it so here too.
        , pathParsed = path.replace(')', ')?')

      router.on(method, pathParsed, require(options.controllers + controller)[fn])
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
      return 'Router would like to do the following: \n' + JSON.stringify({view: view, data: data, opts: opts}) + '\n\n. You need to specify a render method in the router options, or set app.render.'
    }
  })
  options = _.extend(opts, {
    mutualRoutes: require(path.join(opts.base, opts.mutualRoutes))
    , serverRoutes: require(path.join(opts.base, opts.serverRoutes))
    , collections: path.join(opts.base, opts.collections)
    , controllers: path.join(opts.base, opts.controllers)
  })

  mountRoutes(app.router, _.extend({}, options.mutualRoutes, options.serverRoutes))

  app.router.configure({
    before: [
      function(){
        app.log.info('route: ' + this.req.url)
      }
      , function(){
        this.app = app
        this.render = getView
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

