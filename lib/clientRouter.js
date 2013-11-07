'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')

// backbone oddly doesn't have a way of detecting if it's matched a route or not. Monkeypatch it.
// TODO: push this upstream to Backbone
Backbone.history.urlMatch = function(){
  return _.any(Backbone.history.handlers, function(handler) {
    return handler.route.test(Backbone.history.fragment)
  })
}

module.exports = Backbone.Router.extend({
  initialize: function(options){
    this.options = _.defaults((options || {}), {
      collections: 'collections/'
      , controllers: 'controllers/'
      , views: 'views/'
      , app: {}
      , fetch: true
    })
    this.options.app = _.defaults(this.options.app, {
      Views: {}
      , Templates: {}
      , Renders: {}
      , Collections: {}
      , Datas: {}
      , Models: {}
      , Router: this
    })
    this.historyOptions = {
      pushState: _.isUndefined(options.pushState) ? true : !!options.pushState
      , hashChange: _.isUndefined(options.hashChange) ? false : !!options.hashChange
      , root: _.isUndefined(options.root) ? '' : options.root
      , silent: _.isUndefined(options.slient) ? false : !!options.slient
    }

    this.on('route', function(){
      if (!this._started) this._started = true

      if (this._currentFragment) this.currentRender = this.options.app.Renders[this._currentFragment]

      if (this.currentRender) {
        this.currentRender.undelegateEvents()
        this.currentRender.stopListening()
        // trigger a remove event on the view, and let the view deal with killing any dom it doesn't want cached
        this.currentRender.trigger('remove')
      }
      this._currentFragment = Backbone.history.fragment || 'home'
    })

    if (_.isFunction(options.parseRoutes)) options.parseRoutes(this.options)
    else if (options.routesJSON) this._parseRoutes(this.options)

    if (options.actions && options.routes) this._addRoutes(options)

    if (!Backbone.History.started && !this._started && Backbone.history.start(this.historyOptions)) this._started = true
    else this._started = Backbone.History.started
  }
  , _addRoutes: function(options){
    var restart = !Backbone.history.urlMatch()
      , silent

    if (Backbone.History.started && restart) {
      Backbone.history.stop()
      silent = !!this._currentFragment
    }

    _.each(options.actions, function(action, actionName){
      this[actionName] = action
    }, this)
    _.each(options.routes, function(actionName, route){
      this.route(route, actionName)
    }, this)

    if (restart) Backbone.history.start(_.defaults({silent: silent}, this.historyOptions))
  }
  , _parseRoutes: function(options){
    var routes = options.routesJSON
      , restart = !Backbone.history.urlMatch()
      , silent

    if (Backbone.History.started && restart) {
      Backbone.history.stop()
      silent = !!this._currentFragment
    }

    _.each(routes, function(actions, path){
      // marrying director style routes to backbone style routes
      var pathParsed = (path.charAt(0) === '/' ? path.substring(1) : path).replace('*', '*splat') + '(/)'

      _.each(actions, function(controllerAction, method){
        var self = this
          , actionParts = controllerAction.split('#')
          , controller = method.charAt(0) === '3' ? 'redirect' : require(options.controllers + actionParts[0])
          , fn = actionParts[1] || method
          , action = fn === 'render' ? console.error('You can\'t define a render method. It\'s reserved by the router.') : controller[fn]

        // if this is a redirect
        if (controller === 'redirect') this.route(pathParsed, ['redirect', pathParsed].join(''), function(){
          self.navigate(controllerAction, {replace: true, trigger: true})
        })

        if (method === 'get') this.route(pathParsed, controllerAction, function(){
          var params = action.apply(self, _.values(arguments))

          self.render(params.view, params.collection, _.extend(params, this.options))
        })
      }, this)
    }, this)

    if (restart) Backbone.history.start(_.defaults({silent: silent}, this.historyOptions))
  }
  , render: function(view, collection, options){
    var collectionData = !this._started ? window._bootstrapData : null
      , self = this
      , done = options.callback || function(coll){
        self._setView(view, coll, options).render()
      }
      , collectionFilled

    if (view._rendered) return
    else if (!collection) done.call(this)
    else {
      collectionFilled = this._setCollection(collection, collectionData, options)

      options.fetch && !collectionData
        ? this._fetchCollection(collectionFilled, done)
        : done(collectionFilled)
    }

  }
  , _setCollection: function(collectionName, collectionData, options){
    this.options.app.Collections[collectionName] = require(this.options.collections + collectionName)
    this.options.app.Datas[collectionName] = this.options.app.Datas[collectionName] || new this.options.app.Collections[collectionName](collectionData, options)
    return this.options.app.Datas[collectionName]
  }
  , _fetchCollection: function(collection, callback){
    var done = typeof callback === 'function' ? callback : function(){}
    // if we already have data, don't fetch again
    if (collection.length) {
      return done(collection)
    }

    collection.fetch({
      error: function(collection, status, jqXHR){
        console.error(status.status, collection.url, jqXHR, collection)
      }
      , success: done
    })
  }
  , _setView: function(path, collection, opts){
    var data = this._getViewData(opts, collection)
      , options = _.extend((opts || {}), {
        collection: collection
        , data: data.data
      })
      , renderName = Backbone.history.fragment || 'home'
      , render

    options.model = _.isFunction(options.model) ? options.model(collection) : options.model

    if (options && options.title) document.title = _.isFunction(options.title) ? options.title.call(null, options.model || options.colleciton) : options.title

    this.options.app.Views[path] = require(this.options.views + path)
    // use the history fragment here, so that we're sure we're caching views by URL, and not view name which could be the same for many URLs
    if (this.options.app.Renders[renderName]){
      render = this.options.app.Renders[renderName]
      // there's a chance our view's element has been destroyed or unattached from the DOM since
      // we'll recreated it and delegate it's events again
      render.setElement(render.el, true)
    }
    else {
      render = new this.options.app.Views[path](options)
      this.options.app.Renders[renderName] = render
    }

    return render
  }
  , _getViewData: function(opts, collection){
    var result = {}

    if (!opts || !(opts.data && opts.model)) return result

    if (_.isFunction(opts.data)) result.data = opts.data.call(this, collection)
    else if (_.isPlainObject(opts.data) || _.isArray(opts.data)) result.data = opts.data

    if (_.isFunction(opts.model)) result.model = opts.model.call(this, collection)
    else if (opts.model instanceof Backbone.Model) result.model = opts.model

    return result
  }
})
