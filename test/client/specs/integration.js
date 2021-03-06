/*global describe, it, before, Backbone, _, after, expect, beforeEach, afterEach */
'use strict';

var $ = window.$
  , sinon = window.sinon
  , Router = window.Router
  , A
  , opts
  , router

describe('Client router: integration tests:', function(){

  beforeEach(function(done){
    A = {}

    opts = {
      routesJSON: {
        '(/)': {get: 'home#index'}
      }
      , app: A
    }

    if (!$.ajax.restore){
      sinon.stub($, 'ajax').yieldsTo('success', [[{'name': 'street1', 'id': 1}, {'name': 'street 2', 'id': 2}]])
    }

    _.defer(done)
  })

  afterEach(function(){
    if ($.ajax.restore) $.ajax.restore()
  })

  describe('initialization', function(){
    before(function(){
      router = new window.Router({
        routesJSON: window.routes
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
        , start: false
      })

      window.history.pushState({}, 'title', '/')
    })

    after(function(){
      router.navigate('/')
      window.killBackbone()
    })

    it('has a render method', function(){
      router.render.should.be.a('function')
    })

    it('marks that it started', function(){
      router.start(true)
      expect(router._started).to.be.true
    })

    it('redirects when told', function(){
      router.navigate('/redirect', {trigger: true})
      window.location.pathname.should.equal('/redirected')
    })

    it('can fetch a collection', function(done){
      router._fetchCollection(router._setCollection('streets'), function(collection){
        collection.should.be.instanceof(Backbone.Collection)
        expect(collection.length).to.be.above(0)

        done()
      })
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

  describe('/streets', function(){
    beforeEach(function(done){
      router = new window.Router({
        routesJSON: window.routes
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
      })
      // wait for the router to be instantiated before triggering a new route
      _.defer(function(){
        router.navigate('/streets', {trigger: true})
        _.defer(done)
      })
    })

    afterEach(function(){
      router.navigate('/')
      window.killBackbone()
    })

    it('bootstraps data')
    it('notifies that the first route is the initial route')

    it('has the URL /streets', function(){
      window.location.pathname.should.equal('/streets')
    })

    it('renders the street index view', function(){
      $('#app').text().indexOf('street index view').should.not.equal('-1')
    })

    it('renders a view with a parsed collection', function(){
      A.Renders
        .streets
        .collection
        .should.be.instanceof(Backbone.Collection)
    })

    it('/ works with a / at the end of the url', function(){
      router.navigate('/streets/', {trigger: true})
      window.location.pathname.should.equal('/streets/')
      $('#app').text().indexOf('street index view').should.not.equal('-1')
    })

    describe('/:id', function(){
      beforeEach(function(){
        router.navigate('/streets/1', {trigger: true})
      })

      it('has the URL /streets/1', function(){
        window.location.pathname.should.equal('/streets/1')
      })

      it('renders the street detail view', function(){
        $('#app').text().indexOf('street detail view').should.not.equal('-1')
      })

      it('renders a view with a parsed collection', function(done){
        _.defer(function(){
          A.Renders['streets/1'].collection.should.be.instanceof(Backbone.Collection)
          done()
        })
      })

      it.skip('renders a view with a parsed model', function(){
        A.Renders['streets/1'].model.should.be.instanceof(Backbone.Model)
      })
    })
  })

  describe('creating multiple routers', function(){
    // when this test starts, we've already triggered a route on the router
    var router2
      , router3

    beforeEach(function(){
      window.history.pushState({}, 'title', '/')
    })

    afterEach(function(){
      window.killBackbone()
    })

    it('when the first router matches the route, and the second does not it doesn\'t re-render the view', function(){
      router2 = new window.Router({
        routesJSON: {
          '(/)': {get: 'home#index'}
        }
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
        , start: false
      })
      router3 = new window.Router({
        routesJSON: {
          '/router3': {get: 'streets#noop'}
        }
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
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

    it('when the first router has no valid routes, and the second does it doesn\'t re-render', function(){
      router2 = new window.Router({
        routesJSON: {
          '/router3': {get: 'streets#noop'}
        }
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
        , start: false
      })
      router3 = new window.Router({
        routesJSON: {
          '(/)': {get: 'home#index'}
        }
        , collections: 'collections/'
        , views: 'views/'
        , controllers: 'controllers/'
        , app: A
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

  describe('controllers', function(){
    describe('context is similar to the server context', function(){
      var router
        , action

      before(function(){
        window.history.pushState({}, 'title', '/not')
      })

      beforeEach(function(){
        window._user = {id: 1}
        router = new Router(_.extend({start: false}, opts))
        router.start(true)
        action = sinon.spy(require('controllers/home'), 'index')
        router.navigate('/', {trigger: true})
      })

      afterEach(function(){
        action.restore()
        router.navigate('/not')
        window.killBackbone()
      })

      it('has the router\'s _ctx property', function(){
        action.should.have.been.calledOnce
        action.should.have.been.calledOn(router._getCtx())
      })

      it('has `req.user`', function(){
        action.should.have.been.calledOnce
        action.thisValues[0].should.include.keys('req')
        action.thisValues[0].req.should.include.keys('user')
        action.thisValues[0].req.user.should.deep.equal(window._user)
      })

      it('has `res.redirect`', function(){
        action.should.have.been.calledOnce
        action.thisValues[0].should.include.keys('res')
        action.thisValues[0].res.should.include.keys('redirect')
      })
    })
  })

})
