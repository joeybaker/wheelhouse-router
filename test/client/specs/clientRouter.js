/*global describe, it, before, Backbone */
'use strict';

describe('Client router', function(){
  var router
  before(function(){
    router = window.router = new window.Router({
      routesJSON: window.routes
      , collections: 'collections/'
      , views: 'views/'
      , controllers: 'controllers/'
    })

    if (Backbone.history.start({pushState: true})) window.router.started = true
  })
  it('has a render method', function(){
    router.render.should.be.a('function')
  })
  it('doesn', function(){
    router.should.be.a('number')
  })
})
