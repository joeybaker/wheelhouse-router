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
      , start: true
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

      // store the fragment
      this.options.app._currentFragment = Backbone.history.fragment || 'home'
    })

    if (_.isFunction(options.parseRoutes)) options.parseRoutes(this.options)
    else if (options.routesJSON) this._parseRoutes(this.options)

    if (options.actions && options.routes) this._addRoutes(options)

    if (this.options.start) this.start()
  }
  // defer executing the start until the call stack has cleared.
  // This ensures that the router will be avaliable to the views that it's rendering.
  , _start: function(){
    // if we've already decided to start, don't try to start again.
    if (Backbone.history._starting) return

    Backbone.history._starting = true

    // pass this in as an arg instead of using `bind` b/c somebrowsers (noteably) phantomJs choke on a bind.
    _.defer(function(router){
      // Backbone.history.start will return true if it starts successfully
      if (Backbone.history.start(router.historyOptions))
        router._started = true

      // regardless of a successful start, we're no longer trying to start the router
      Backbone.history._starting = false
    }, this)
  }
  , _addRoutes: function(options){
    var restart = !Backbone.history.urlMatch() && !Backbone.history._starting
      , silent

    if (Backbone.History.started && restart) {
      Backbone.history.stop()
      silent = !!this.options.app._currentFragment
    }

    _.each(options.actions, function(action, actionName){
      this[actionName] = action
    }, this)
    _.each(options.routes, function(actionName, route){
      this.route(route, actionName)
    }, this)

    if (restart) this._start()
  }
  , _parseRoutes: function(options){
    var routes = options.routesJSON
      , restart = !Backbone.history.urlMatch() && !Backbone.history._starting
      , silent

    if (Backbone.History.started && restart) {
      Backbone.history.stop()
      silent = !!this.options.app._currentFragment
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

    if (restart) this._start()
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
      collectionFilled = this._setCollection(collection, collectionData, options.options)

      options.fetch && !collectionData
        ? this._fetchCollection(collectionFilled, done)
        : done(collectionFilled)
    }

  }
  , _setCollection: function(collectionName, collectionData, options){
    this.options.app.Collections[collectionName] = require(this.options.collections + collectionName)
    if (this.options.app.Datas[collectionName])
      this.options.app.Datas[collectionName].set(collectionData)
    else
      this.options.app.Datas[collectionName] = new this.options.app.Collections[collectionName](_.isArray(collectionData) ? collectionData : [collectionData], options)

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
  , _updateRender: function(renderName){
    // if we've already rendered something, remove it's events
    if (this.options.app._currentRender){
      this.options.app._currentRender.undelegateEvents()
      this.options.app._currentRender.stopListening()
      // trigger a remove event on the view, and let the view deal with killing any dom it doesn't want cached
      this.options.app._currentRender.trigger('remove')
    }

    // set this as the current render
    this.options.app._currentRender = this.options.app.Renders[renderName]
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

    // unbind all previous events
    // set this render to be the _currentRender
    this._updateRender(renderName)

    return render
  }
  , _getViewData: function(opts, collection){
    var result = {}

    if (!opts || !opts.model) return result

    if (_.isFunction(opts.model)) result.model = opts.model.call(this, collection)
    else if (opts.model instanceof Backbone.Model) result.model = opts.model

    return result
  }
})
