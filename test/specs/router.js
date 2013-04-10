/*globals describe, it */
'use strict';
var app = require('../fixtures/app')
  , request = require('request')

describe('router', function(){
  var port = app.config.get('port')

  it('attaches to a flatiron app', function(){
    app.router.routes.should.be.an('object')
  })

  describe('/', function(){
    it('renders the home controller', function(done){
      request.get('http://localhost:' + port, function(err, res, body){
        body.should.exist
        body.indexOf('{"view":"home"}').should.not.equal(-1)
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
        }, function(err, res){
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

