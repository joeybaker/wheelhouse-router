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
    window.killBackbone()

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
    it('creates a cid', function(){
      var r = new Router(opts)
      expect(r.cid).to.exist
    })
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

    it('properly restarts after adding routes')
  })

  describe('#_addRoutes', function(){
    it('can parse routes from json')
  })

  describe('#_parseRoutes', function(){
    it('can parse routes from actions')
  })

  describe('#render', function(){
    var router

    beforeEach(function(){
      router = new Router(_.extend({start: false}, opts))
    })

    it('loads boostrap data on the initial route', function(){
      var data = {boostrap: true}
      window._bootstrapData = data

      // just ensure that our condition for loading boostrapped data is in place
      expect(A._initialRouteHasFired).to.be.undefined

      sinon.spy(router, '_setCollection')
      router.render('home', 'streets')
      expect(router._setCollection).to.have.been.calledWithMatch('streets', data)

      window._bootstrapData = void 0
    })

    it('bails on an already _rendered view', function(){
      // get the view in to the Renders object
      router.render('home')
      sinon.spy(A.Renders['/'], 'render')
      // render once to confirm that the method is called
      router.render('home')
      expect(A.Renders['/'].render).to.have.been.calledOnce
      // mark as rendered and ensure render isn't called
      A.Renders['/']._rendered = true
      A.Renders['/'].render.reset()
      router.render('home')
      expect(A.Renders['/'].render).to.not.have.been.called
    })

    it('renders a view without collections', function(){
      sinon.spy(router, '_fetchCollection')
      sinon.spy(router, '_setCollection')
      sinon.spy(router, '_setView')
      expect(window._bootstrapData).to.be.undefined

      router.render('home')
      expect(router._fetchCollection).to.not.have.been.called
      expect(router._setCollection).to.not.have.been.called
      expect(router._setView).to.have.been.calledOnce
    })

    it('renders a view with a collection after fetching the collection when the `options.fetch` option is true', function(){
      sinon.spy(router, '_fetchCollection')
      sinon.spy(router, '_setView')
      router.render('home', 'streets', {fetch: true})
      expect(router._fetchCollection).to.have.been.calledOnce
      expect(router._setView).to.have.been.calledOnce
    })

    it('renders a view with a collection without fetching the collection when `options.fetch` is false', function(){
      sinon.spy(router, '_fetchCollection')
      sinon.spy(router, '_setView')
      router.render('home', 'streets', {fetch: false})
      expect(router._fetchCollection).to.not.have.been.called
      expect(router._setView).to.have.been.calledOnce
    })
  })

  describe('#_setCollection', function(){
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
