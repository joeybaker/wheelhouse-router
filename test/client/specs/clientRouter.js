/*global describe, it, before, $, Backbone, _, after, expect */
'use strict';

describe('Client router', function(){
  var router = window.router

  it('has a render method', function(){
    router.render.should.be.a('function')
  })
  it('starts at the root URL', function(){
    window.location.pathname.should.equal('/')
  })
  it('marks that it started', function(){
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

  it('can parse routes and actions')

  describe('/streets', function(){
    before(function(){
      router.navigate('/streets', {trigger: true})
    })
    it('bootstraps data')
    it('has the URL /streets', function(){
      window.location.pathname.should.equal('/streets')
    })
    it('renders the street index view', function(){
      $('#app').text().indexOf('street index view').should.not.equal('-1')
    })
    it('renders a view with a parsed collection', function(done){
      // defer so that the collection fetch has the chance to process. normally this would happen in the view, so we'd be all good.
      _.defer(function(){
        window.A.Renders.streets.collection.should.be.instanceof(Backbone.Collection)
        done()
      })
    })
    it('/ works with a / at the end of the url', function(){
      router.navigate('/streets/', {trigger: true})
      window.location.pathname.should.equal('/streets/')
      $('#app').text().indexOf('street index view').should.not.equal('-1')
    })

    describe('/:id', function(){
      before(function(){
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
          window.A.Renders['streets/1'].collection.should.be.instanceof(Backbone.Collection)
          done()
        })
      })
      // it('renders a view with a parsed model', function(){
      //   A.Renders['streets/1'].model.should.be.instanceof(Backbone.Model)
      // })
    })
  })

  after(function(){
    router.navigate('/', {trigger: true})
  })
})
