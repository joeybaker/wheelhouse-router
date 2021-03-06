'use strict';
/*global describe, it, before, after, beforeEach */

var app = require('../fixtures/app')
  , plugin = require('../../index.js')
  , chai = require('chai')
  , expect = chai.expect
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , request

chai.use(sinonChai)

describe('router', function(){
  var port = app.config.get('port')

  beforeEach(function(){
    request = {
      req: {}
      , res: {
        end: function(){}
        , writeHead: function(){}
      }
    }
  })

  before(function(done){
    app.options.log = {console: {silent: true}}
    app.start(port, done)
  })

  describe('#respondWithError', function(){
    var fn = plugin.internals.respondWithError

    it('does nothing if the headers have already been sent', function(){
      request.res.headerSent = true
      sinon.spy(app.log, 'debug')
      sinon.spy(app.log, 'warn')

      fn.call(request)

      expect(app.log.debug).to.have.been.calledOnce
      expect(app.log.warn).to.not.have.been.called

      app.log.debug.restore()
      app.log.warn.restore()
    })

    it('logs the stack trace if the error is 5**', function(){
      var status = 404
        , log = sinon.spy(app.log, 'warn')

      fn.call(request, status)
      expect(log).to.have.been.called
      // get the second arg of the first call
      expect(log.args[0][1].stack).to.not.exist

      status = 500
      fn.call(request, status)
      expect(log).to.have.been.called
      // get the second arg of the second call
      expect(log.args[1][1].stack).to.be.an.array

      log.restore()
    })

    it('logs the user', function(){
      var status = 404
        , log = sinon.spy(app.log, 'warn')

      fn.call(request, status)
      expect(log).to.have.been.called
      // get the second arg of the first call
      expect(log.args[0][1].user).to.be.a.string

      log.restore()
    })

    it('sets the status code', function(){
      var status = 404

      sinon.spy(request.res, 'writeHead')

      fn.call(request, status)
      expect(request.res.writeHead).to.have.been.calledOnce
      expect(request.res.writeHead.args[0][0]).to.equal(status)

      request.res.writeHead.restore()
    })

    it('responds with the error template', function(){
      var status = 404
      plugin.internals.options.err[status] = '404'
      sinon.spy(plugin.internals, 'buildTemplate')
      sinon.spy(request.res, 'end')

      fn.call(request, status)

      expect(plugin.internals.buildTemplate).to.have.been.calledOnce
      expect(request.res.end).to.have.been.calledOnce

      plugin.internals.buildTemplate.restore()
      delete plugin.internals.options.err[status]
      request.res.end.restore()
    })

    it('responds with the error code if no template is specified', function(){
      var status = 404
      sinon.spy(plugin.internals, 'buildTemplate')
      sinon.spy(request.res, 'end')

      expect(plugin.internals.options.err[status]).to.not.exist

      fn.call(request, status)

      expect(request.res.end).to.have.been.calledOnce

      plugin.internals.buildTemplate.restore()
      request.res.end.restore()
    })
  })

  describe('#getRequestUserJSON', function(){
    var fn = plugin.internals.getRequestUserJSON

    it('returns JSON if the request has a user object', function(){
      request.req.user = {}

      expect(fn.call(request)).to.be.an.object

      delete request.req.user
    })

    it('runs toJSON if the request has a user object with a toJSON function', function(){
      request.req.user = {toJSON: sinon.spy()}

      expect(fn.call(request)).to.be.an.object
      expect(request.req.user.toJSON).to.have.been.calledOnce

      delete request.req.user
    })

    it('returns undefined if the request doesn\'t have a user', function(){
      expect(fn.call(request)).to.not.exist
    })
  })

  describe('#parseControllerMethod', function(){
    var fn = plugin.internals.parseControllerMethod
      , method = 'test'
      // mock controller
      , controller = {
        test: sinon.spy()
      }
      , collection = {
        id: 'this is a collection'
      }

    it('runs the method with the collection', function(){
      fn.call(request, controller, method, collection, {})
      expect(controller.test).to.have.been.calledWith(collection)
    })

    it.skip('catches errors if the method throws', function(){
      controller[method] = sinon.mock()
      controller[method].throws()

      // sinon.spy(plugin.internals, 'parseControllerMethod')
      sinon.spy(fn)
      // sinon.spy(controller, method)
      expect(fn.bind(request, controller, method, collection, {})).to.have.thrown()
      expect(controller[method]).to.have.thrown()

      // expect(fn.bind(request, controller, method, collection, {})).to.have.thrown()
      // expect(fn).to.have.thrown()

      plugin.internals.parseControllerMethod.restore()
    })

    it('returns an object if the method is an object')
    it('returns the model if the method is undefined')
    it('returns the collection if the method and model are undefined')
  })

  describe('#buildTemplate', function(){
    it('finds the title from a function')
    it('finds the title from a string')
    it('calls the optionally passed render method')
    it('calls #render if no render method was set')
    it('calls render with a template')
    it('calls render with the request context')
    it('calls render with data')
  })

  describe('#render', function(){
    it('builds the template with the collection if it is present in app.collections')
    it('fetches data for the collection if the collection doesn\'t exist on the app')
    it('builds the template without a collection if none is defined')
    it('doesn\'t set headers if they\'ve already been set')
    it('sets a 200 status code')
    it('calls res.end')
  })

  describe('#mountRoutes', function(){
    it('attaches routes to the app router')
    it('creates a route that returns a 403 on optional permissions returning false')
    it('redirects if a 30* method is passed')
    it('it calls render for GET requests')
  })

  describe('exports.name', function(){
    it('equals routerPlugin', function(){
      expect(plugin.name).to.equal('routerPlugin')
    })
  })

  describe('exports.attach', function(){
    it('parses the options')
    it('attaches the options to internals')
    it('mounts the routes')
    it('logs the route on every request')
    it('adds options.before to the router before array')
    it('adds options.on to the router on array')
    it('notfound returns a 404 page')
  })

  after(function(done){
    app.server.close(done)
  })
})
