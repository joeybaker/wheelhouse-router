/*global describe, it, before, $, Backbone */
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
    router._started.should.be.true
  })

  describe('/streets', function(){
    before(function(){
      router.navigate('/streets', {trigger: true})
    })
    it('has the URL /streets', function(){
      window.location.pathname.should.equal('/streets')
    })
    it('renders the street index view', function(){
      $('#app').text().indexOf('street index view').should.not.equal('-1')
    })
    it('renders a view with a parsed collection', function(){
      A.Renders.streets.collection.should.be.instanceof(Backbone.Collection)
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
      it('renders a view with a parsed collection', function(){
        A.Renders['streets/1'].collection.should.be.instanceof(Backbone.Collection)
      })
      // it('renders a view with a parsed model', function(){
      //   A.Renders['streets/1'].model.should.be.instanceof(Backbone.Model)
      // })
    })
  })

})
