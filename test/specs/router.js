/*globals describe, it */
'use strict';
var app = require('../fixtures/app')
  , request = require('request')

describe('router', function(){
  var port = app.config.get('port') + 21

  it('attaches to a flatiron app', function(){
    app.router.routes.should.be.an('object')
  })

  describe('/', function(){
    it('should render HTML', function(done){
      request.get('http://localhost:' + port, function(err, res, body){
        body.should.exist
        body.indexOf('<!DOCTYPE html').should.equal(0)
        done()
      })
    })
  })

  describe('/api', function(){
    describe('/accesspoints', function(){
      var url = 'http://localhost:' + port + '/api/accesspoints'
        , id
      it('POSTs JSON', function(done){
        request.post({
          url: url
          , json: {name: 'test-name2'}
        }, function(err, res, body){
          if (err) throw err
          res.statusCode.should.equal(200)
          id = body._id
          body.should.exist
          done()
        })
      })
      it('PUTs JSON', function(done){
        request.put({
          url: url + '/' + encodeURIComponent(id)
          , json: {name: 'test-revised-again'}
        }, function(err, res, body){
          res.statusCode.should.equal(200)
          body._rev.indexOf('2-').should.equal(0)
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

