'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')

_.str = require('underscore.string')

Backbone.history.on('route', function(router){
  // TODO: we're still leaking DOM elements. need to use .remove()
  if (router._currentFragment) A.Renders[router._currentFragment].undelegateEvents()
  router._currentFragment = Backbone.history.fragment || 'home'
  A.Renders[router._currentFragment].delegateEvents()
})

module.exports = Backbone.Router.extend({
  initialize: function(options){
    if (options.routesJSON) this._parseRoutesJSON(options.routesJSON)
    _.defaults(options, {
      collections: 'collections/'
      , controllers: 'controllers/'
      , views: 'views/'
    })
  }
  , _parseRoutesJSON: function(routes){
    _.each(routes, function(actions, path){
      _.each(actions, function(action, method){
        var actionParts = action.split('#')
          , controller = actionParts[0]
          , fn = actionParts[1] || method
          // marrying director style routes to backbone style routes
          , pathParsed = (path.charAt(0) === '/' ? path.substring(1) : path).replace('*', '*splat')

        if (fn === 'render') return console.error('You can\'t define a render method. It\'s reserved by the router.')
        if (method === 'get') this.route(pathParsed, action, require(this.options.controllers + controller)[fn])
      }, this)
    }, this)
  }
  // TODO: context is only used serverside, it would be great to eliminate it there.
  , render: function(context, view, collection, options){
    var collectionData = !this.started ? window._data : null
    this._setView(view, this._fetchCollection(this._setCollection(collection, collectionData)), options).render()
  }
  , _setCollection: function(collectionName, collectionData){
    A.Collections[collectionName] = require(this.options.collections + collectionName)
    A.Datas[collectionName] = A.Datas[collectionName] || new A.Collections[collectionName](collectionData)
    return A.Datas[collectionName]
  }
  , _fetchCollection: function(collection, callback){
    var done = typeof callback === 'function' ? callback : function(){}
    // if we already have data, don't fetch again
    if (collection.length > 2) {
      done(collection)
      return collection
    }

    collection.fetch({
      error: function(collection, status, jqXHR){
        console.error(status.status, collection.url, jqXHR, collection)
      }
      , success: function(){
        done(collection)
      }
    })
    return collection
  }
  , _setView: function(path, collection, opts){
    var data = this._getViewData(opts.data, collection)
      , options = _.defaults((opts || {}), {
        collection: collection
        , model: data.model
        , data: data
      })

    if (_.isFunction(options.setModel)) options.model = options.setModel(collection)

    A.Views[path] = require(this.options.views + path)
    // use the history fragment here, so that we're sure we're caching views by URL, and not view name which could be the same for many URLs
    A.Renders[Backbone.history.fragment || 'home'] = A.Renders[Backbone.history.fragment || 'home'] || new A.Views[path](options)
    return A.Renders[Backbone.history.fragment || 'home']
  }
  , _getViewData: function(dataFn, collection){
    var result
    if (_.isFunction(dataFn)) result = dataFn.call(this, collection)
    else if (_.isPlainObject(dataFn) || _.isArray(dataFn)) return dataFn

    return _.has(result, 'id') ? {model: result} : result
  }
})
