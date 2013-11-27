/*global expect, describe, it */
'use strict';

var router = window.router

describe('Client router', function(){
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
