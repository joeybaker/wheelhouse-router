/*global expect, describe, it, beforeEach, afterEach */
'use strict';

var router = window.router
  , sinon = window.sinon
  , Router = window.Router
  , Backbone = window.Backbone
  , _ = window._
  , A
  , opts

describe('Client router unit tests', function(){
  beforeEach(function(done){
    // reset backbone.history
    Backbone.history.stop()
    Backbone.history.handlers = []
    Backbone.history._starting = false
    Backbone.history.fragment = undefined
    Backbone.History.started = false

    // reset the app
    A = {}
    opts = {
      routesJSON: {
        '(/)': {get: 'home#index'}
      }
      , app: A
    }

    // ensure the call stack is clear
    _.defer(done)
  })

  describe('#initialize', function(){
    it('creates a cid')
  })

  describe('options', function(){
    describe('start', function(){
      it('does not start History when set to `false`', function(done){
        var r = new Router(_.extend({
          start: false
        }, opts))

        _.defer(function(){
          expect(r._started).to.be.false
          done()
        })
      })

      it('starts Backbone.history when not set', function(done){
        var r = new Router(opts)
        _.defer(function(){
          expect(Backbone.History.started).to.be.true
          expect(r._started).to.be.true
          done()
        })
      })
    })

    describe('fetch', function(){})
  })

  describe('#start', function(){
    beforeEach(function(){
      sinon.spy(Backbone.history, 'start')
    })

    afterEach(function(){
      Backbone.history.start.restore()
    })

    it('starts async', function(done){
      var r = new Router(opts)
      expect(r._started).to.be.false

      _.defer(function(){
        expect(r._started).to.be.true
        expect(Backbone.history.start).to.have.been.calledOnce
        done()
      })
    })

    it('starts immediately when passed `true`', function(done){
      var r = new Router(_.extend({
        start: false
      }, opts))

      _.defer(function(){
        r.start(true)
        expect(r._started).to.be.true
        expect(Backbone.History.started).to.be.true
        done()
      })
    })

    it('does not attempt to start Backbone.History again', function(){
      var r = new Router(_.extend({
        start: false
      }, opts))

      expect(Backbone.History.started).to.be.false
      expect(r._started).to.be.false
      expect(Backbone.history.fragment).to.be.undefined

      r.start(true)
      r.start(true)

      expect(Backbone.history.start).to.have.been.calledOnce
      expect(Backbone.History.started).to.be.true
    })

    it('does not reload the same url', function(){
      var r = new Router(_.extend({
        start: false
      }, opts))

      sinon.spy(r, 'render')

      r.start(true)
      r.start(true)

      expect(Backbone.history.start).to.have.been.calledOnce
      expect(r.render).to.have.been.calledOnce
    })

    it('marks that Backbone.history._starting to `false` when complete', function(done){
      var r = new Router(_.extend({
        start: false
      }, opts))

      r.start()
      expect(Backbone.history._starting).to.be.true
      _.defer(function(){
        expect(Backbone.history._starting).to.be.false
        done()
      })
    })

    it('loads a newly added url if an additional router adds routes, history has already started, no routes matched previously, but a new one does.', function(){
      var r1, r2
      sinon.spy(Backbone.history, 'loadUrl')

      r1 = new Router(_.extend({}, opts, {
        routesJSON: {
          '/non-route': {get: 'home#index'}
        }
        , start: false
      }))
      r2 = new Router(_.extend({
        start: false
      }, opts))

      r1.start(true)
      r2.start(true)

      expect(Backbone.history.loadUrl).to.have.been.calledOnce
      expect(r2._started).to.be.true

      Backbone.history.loadUrl.restore()
    })
  })

  it('can parse routes from json')
  it('can parse routes from actions')
  it('properly restarts after adding routes')
  it('doesn\'t retrigger `Backbone.history.start` if a previous route has been matched')

  it('doesn\'t fetch the collection if fetch is set to false')

  // TODO: move me to integration tests
  describe('creating multiple routers', function(){
    // when this test starts, we've already triggered a route on the router
    var router2
      , router3

    describe('when the first router matches the route, and the second does not', function(){
      it('doesn\'t re-render the view', function(){
        router2 = new window.Router({
          routesJSON: {
            '(/)': {get: 'home#index'}
          }
          , collections: 'collections/'
          , views: 'views/'
          , controllers: 'controllers/'
          , app: window.A
          , start: false
        })
        router3 = new window.Router({
          routesJSON: {
            '/router3': {get: 'streets#noop'}
          }
          , collections: 'collections/'
          , views: 'views/'
          , controllers: 'controllers/'
          , app: window.A
          , start: false
        })

        sinon.spy(router2, 'render')
        sinon.spy(router3, 'render')

        router2.start(true)
        router3.start(true)

        expect(Backbone.History.started).to.be.true
        expect(router2.render).to.have.been.calledOnce
        expect(router3.render).to.not.have.been.called
      })
    })

    describe('when the first router has no valid routes, and the second does', function(){
      it('doesn\'t re-render', function(){
        router2 = new window.Router({
          routesJSON: {
            '/router3': {get: 'streets#noop'}
          }
          , collections: 'collections/'
          , views: 'views/'
          , controllers: 'controllers/'
          , app: window.A
          , start: false
        })
        router3 = new window.Router({
          routesJSON: {
            '(/)': {get: 'home#index'}
          }
          , collections: 'collections/'
          , views: 'views/'
          , controllers: 'controllers/'
          , app: window.A
          , start: false
        })

        sinon.spy(router2, 'render')
        sinon.spy(router3, 'render')

        router2.start(true)
        router3.start(true)

        expect(Backbone.History.started).to.be.true
        expect(router2.render).to.not.have.been.called
        expect(router3.render).to.have.been.calledOnce
      })
    })
  })

  describe('_setCollection', function(){

    it('creates a new A.Datas collection with data', function(){
      var collection
      expect(router._setCollection).to.exist
      expect(router.options.app.Collections.streets).to.exist
      // router.options.app.Datas.streets = null
      collection = router._setCollection('streets', [{id: 1}])
      expect(router.options.app.Datas.streets.length).to.equal(1)
    })

    it('overwrites the collection data with any data passed to it', function(){
      var collection
      expect(router._setCollection).to.exist
      collection = router._setCollection('streets', [{id: 1}])
      expect(collection.length).to.equal(1)
      collection = router._setCollection('streets', [{id: 1}, {id: 2}])
      expect(collection.length).to.equal(2)
      expect(collection.first().id).to.equal(1)
    })
  })
})
