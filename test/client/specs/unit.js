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
  it('can parse routes from json')
  it('can parse routes from actions')
  it('properly restarts after adding routes')
  it('doesn\'t retrigger Backbone.History.start if a previous route has been matched')
  it('doesn\'t fetch the collection if fetch is set to false')
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
