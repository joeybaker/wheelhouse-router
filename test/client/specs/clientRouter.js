/*global describe, it, before, Backbone */
'use strict';

describe('Client router', function(){
  var router
  before(function(){
    window.A = {}
    router = window.router = new window.Router({
      routesJSON: window.routes
      , collections: 'collections/'
      , views: 'views/'
      , controllers: 'controllers/'
      , app: window.A
    })

    if (Backbone.history.start({pushState: true})) window.router.started = true
  })
  it('has a render method', function(){
    router.render.should.be.a('function')
  })
  it('starts at the root URL', function(){
    window.location.pathname.should.equal('/')
  })

  describe('/streets', function(){
    before(function(){
      router.navigate('/streets', {trigger: true})
    })
    it('has the URL /streets', function(){
      console.log($('body').text())
      window.location.pathname.should.equal('/streets')
    })

  })
})
