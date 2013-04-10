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

function render(context, view, collection, options){
  var data = getViewData(context, collection, options.data)
  if (app.env === 'development') {
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

  if (collection) collection.fetch({success: function(){
    render(context, view, collection, collectionParse)
  }, error: app.log.error})
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
  var paths = app.config.get('paths')
  app = this

  _.defaults(opts , {
    mutualRoutes: paths.mutualRoutes
    , serverRoutes: paths.serverRoutes
    , collections: paths.collections
    , controllers: paths.controllers
    , base: app._base
    , render: app.render
  })
  options = _.extend(opts, {
    mutualRoutes: require(path.join(opts.base, paths.mutualRoutes))
    , serverRoutes: require(path.join(opts.base, paths.serverRoutes))
    , collections: path.join(opts.base, paths.collections)
    , controllers: path.join(opts.base, paths.controllers)
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
        this.res.end(app.render('err/404'))
      }
    }
    , strict: false
    , recurse: 'forward'
  })
}

