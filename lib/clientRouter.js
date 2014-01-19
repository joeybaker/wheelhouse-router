'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')
  , router = {}

// backbone oddly doesn't have a way of detecting if it's matched a route or not. Monkeypatch it.
// TODO: push this upstream to Backbone
Backbone.history.urlMatch = function(){
  return _.any(Backbone.history.handlers, function(handler){
    return handler.route.test(Backbone.history.fragment)
  })
}

router.initialize = function(options){
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
    , Routers: {}
  })

  this.cid = _.uniqueId('router')
  this.options.app.Routers[this.cid] = this
  this._started = false

  // TODO: story this on Backbone.history since they're a global, not a router, config
  this.historyOptions = {
    pushState: _.isUndefined(options.pushState) ? true : !!options.pushState
    , hashChange: _.isUndefined(options.hashChange) ? false : !!options.hashChange
    , root: _.isUndefined(options.root) ? '' : options.root
    , silent: _.isUndefined(options.slient) ? false : !!options.slient
  }

  this.on('route', function(){
    if (!this._started) this._started = true
    if (!this.options.app._initialRouteHasFired) this.options.app._initialRouteHasFired = true

    // store the fragment
    this.options.app._currentFragment = Backbone.history.fragment || '/'
  })

  if (_.isFunction(options.parseRoutes)) options.parseRoutes(this.options)
  else if (options.routesJSON) this._parseRoutes(this.options)

  if (options.actions && options.routes) this._addRoutes(options)

  if (this.options.start) this.start()
}

// defer executing the start until the call stack has cleared.
// This ensures that the router will be available to the views that it's rendering.
router.start = function start(immediate){
  // pass the router in as an arg instead of using `bind` b/c some browsers (notably) phantomJs choke on a bind.
  var backboneStart = function(router){
    // Backbone.history.start will return true if it starts successfully
    if (Backbone.history.start(router.historyOptions))
      router._started = true

    // regardless of a successful start, we're no longer trying to start the router
    Backbone.history._starting = false
  }

  if (Backbone.History.started){
    /* if we've already started, and no routes matched
    check to see if any of the newly added routes match the current URL
    */
    if (!this._started && Backbone.history.urlMatch() && !this.options.app._currentFragment){
      Backbone.history.loadUrl()
      this._started = true
    }

    // if we already have a matched route, just bail
    return this
  }
  /* if we've already decided to start, don't try to start again.
  This will prevent two routers from conflicting start statements since start is async by default
  */
  else if (Backbone.history._starting){
    /* we attempted to started before Backbone.history kicked off
    assume that the previous start will look at the routes we've added in this router
    */
    this._started = true
    return this
  }

  Backbone.history._starting = true

  if (immediate)
    backboneStart(this)
  else
    _.defer(backboneStart, this)

  return this
}

router._addRoutes = function(options){
  _.each(options.actions, function(action, actionName){
    this[actionName] = action
  }, this)
  _.each(options.routes, function(actionName, route){
    this.route(route, actionName)
  }, this)
}

router._parseRoutes = function(options){
  var routes = options.routesJSON

  _.each(routes, function(actions, path){
    // marrying director style routes to backbone style routes
    var pathParsed = (path.charAt(0) === '/' ? path.substring(1) : path).replace('*', '*splat') + '(/)'

    _.each(actions, function(controllerAction, method){
      var self = this
        , actionParts = controllerAction.split('#')
        , controller = method.charAt(0) === '3' ? 'redirect' : require(options.controllers + actionParts[0])
        , fn = actionParts[1] || method
        , action

      if (_.indexOf(_.keys(this).concat(['render', 'start']), fn) > -1 || fn.charAt(0) === '-')
        throw new Error('You can\'t define a ' + fn + ' method. It\'s reserved by the router.')
      else
        action = controller[fn]

      // if this is a redirect
      if (controller === 'redirect') this.route(pathParsed, ['redirect', pathParsed].join(''), function(){
        self.navigate(controllerAction, {replace: true, trigger: true})
      })

      if (method === 'get') this.route(pathParsed, controllerAction, function(){
        var params = action.apply(self, arguments)

        self.render(params.view, params.collection, params)
      })
    }, this)
  }, this)
}

router.render = function(view, collection, options){
  var self = this
    , done
    , collectionFilled
    , collectionData

  if (!_.isString(view)) throw new Error('Must pass a view name')
  options || (options = {})

  // if this is the first route, we'll use any boostrapped data we find
  if (!this.options.app._initialRouteHasFired) collectionData = window._bootstrapData

  // after we process the collection, we'll create the view
  done = options.callback || function(coll){
    var v = self._setView(view, coll, options)
    if (v._rendered) return
    else v.render()
  }

  // deal with the collection
  if (!collection) done()
  else {
    collectionFilled = this._setCollection(collection, collectionData, options.options)

    options.fetch && !collectionData
      ? this._fetchCollection(collectionFilled, done, options)
      : done(collectionFilled)
  }
}

router._setCollection = function(collectionName, collectionData, options){
  var data

  if (_.isArray(collectionData)){
    data = collectionData.length ? collectionData : void 0
  }
  else if (_.isPlainObject(collectionData)){
    data = [collectionData]
  }

  this.options.app.Collections[collectionName] = require(this.options.collections + collectionName)
  if (this.options.app.Datas[collectionName])
    this.options.app.Datas[collectionName].set(collectionData)
  else
    this.options.app.Datas[collectionName] = new this.options.app.Collections[collectionName](data, options)

  return this.options.app.Datas[collectionName]
}

router._fetchCollection = function(collection, callback, options){
  var done = _.isFunction(callback) ? callback : function(){}
    , fetchOptions

  // if we already have data, don't fetch again
  if (collection.length) {
    return done(collection)
  }

  fetchOptions = {
    error: function(){
      // IE < 10 compatibility
      if (console.error.apply) console.error.apply(console, arguments)
      else console.error(arguments)
    }
    , success: done
  }

  // optional url override just for this fetch
  if (options && options.options && options.options.url) fetchOptions.url = options.options.url

  collection.fetch(fetchOptions)
}

router._updateRender = function(renderName){
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

router._setView = function(path, collection, opts){
  var options = _.extend((opts || {}), {
      collection: collection
    })
    , renderName = Backbone.history.fragment || '/'
    , render

  options.model = _.isFunction(options.model)
    ? options.model(collection)
    : options.model

  // if the url has been modified in a fetch, reset it
  // TODO: this is hacky
  if (options.model) options.model.url = Backbone.Model.prototype.url

  if (options.title){
    document.title = _.isFunction(options.title)
      ? options.title(options.model || options.collection)
      : options.title
  }

  this.options.app.Views[path] = require(this.options.views + path)

  // use the history fragment here, so that we're sure we're caching views by URL
  // and not view name which could be the same for many URLs
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

module.exports = Backbone.Router.extend(router)
