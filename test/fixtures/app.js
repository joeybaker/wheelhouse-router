/*global before, after */
'use strict';
var flatiron = require('flatiron')
  , app = flatiron.app
  , path = require('path')
  , _ = require('lodash')
  , routerPlugin = require('../../lib/serverRouter')
  , handlebarsPlugin = require('wheelhouse-handlebars')

require('chai').should()

app._base = __dirname
process.env.NODE_ENV = 'test'

app.config.file(path.join(__dirname, 'config.json'))

app.use(flatiron.plugins.http, {})
app.use(handlebarsPlugin, {templates: path.join(__dirname, 'templates')})
app.use(routerPlugin, {
  base: __dirname // all paths are relative to this directory
  , mutualRoutes: './routes.json' // routes that are common client and server side
  , serverRoutes: './routesServer.json' // routes that only the server will have (e.g. the routes that you'll go to get get JSON for your collections)
  , collections: './collections/' // path to your collections
  , controllers: './controllers/' // path to your controllers
})

module.exports = app

_.once(function(){
  before(function(done){
    var port = app.config.get('port') + 21
    if (!app.server) app.start(port, done)
    else done()
  })

  after(function(done){
    app.server.close()
    app = undefined
    done()
  })
})
