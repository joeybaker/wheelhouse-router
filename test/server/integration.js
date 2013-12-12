/*global describe, it, before */
'use strict';
var app = require('../fixtures/app')
  , request = require('request')
  , chai = require('chai')
  , should = chai.should()

describe('router', function(){
  var port = app.config.get('port')

  before(function(done){
    app.options.log = {console: {silent: true}}
    app.start(port, done)
  })

  it('attaches to a flatiron app', function(){
    app.router.routes.should.be.an('object')
  })

  describe('server controllers', function(){
    it('modifies the output', function(done){
      request.get('http://localhost:' + port, function(err, res, body){
        body.should.exist
        body.indexOf('api value').should.not.equal(-1)
        done()
      })
    })
  })

  it('redirects when given a redirect method', function(done){
    var url = 'http://localhost:' + port + '/redirect'
    request(url, function(err, res){
      res.req.path.should.equal('/redirected')
      done()
    })
  })

  describe('/', function(){
    it('renders the home controller', function(done){
      request.get('http://localhost:' + port, function(err, res, body){
        body.should.exist
        body.indexOf('"view":"home"').should.not.equal(-1)
        done()
      })
    })
  })

  describe('/streets', function(){
    var url = 'http://localhost:' + port + '/streets'
    describe('/', function(){
      it('renders the street controller with the index action', function(done){
        request.get(url, function(err, res, body){
          body.should.exist
          body.indexOf('"view":"streets/index"').should.not.equal(-1)
          done()
        })
      })
    })

    describe('/:id', function(){
      it('renders the street controller with the detail action', function(done){
        request.get(url + '/1', function(err, res, body){
          body.should.exist
          body.indexOf('"view":"streets/detail"').should.not.equal(-1)
          done()
        })
      })
    })

    describe('/:id/edit/', function(){
      it('renders the street controller with the edit action', function(done){
        request.get(url + '/1/edit/', function(err, res, body){
          body.should.exist
          body.indexOf('"view":"streets/edit"').should.not.equal(-1)
          done()
        })
      })
    })
  })

  describe('/api', function(){
    describe('/streets', function(){
      var url = 'http://localhost:' + port + '/api/streets'
        , id
      it('POSTs JSON', function(done){
        request.post({
          url: url
          , json: {name: 'test-name2'}
        }, function(err, res, body){
          if (err) throw err
          res.statusCode.should.equal(200)
          id = body.id
          body.should.exist
          done()
        })
      })
      it('PUTs JSON', function(done){
        request.put({
          url: url + '/' + encodeURIComponent(id)
          , json: {name: 'test-revised-again'}
        }, function(err, res, body){
          should.exist(body)
          res.statusCode.should.equal(200)
          done()
        })
      })
      it('GETs JSON', function(done){
        request.get(url, function(err, res, body){
          res.statusCode.should.equal(200)
          body.should.exist
          done()
        })
      })
      it('DELETEs via an id', function(done){
        request.del(url + '/' + encodeURIComponent(id), function(err, res){
          if (err) console.error(err)
          res.statusCode.should.equal(200)
          done()
        })
      })
    })
  })
})

