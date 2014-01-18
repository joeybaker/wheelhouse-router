'use strict';
var flatiron = require('flatiron')
  , app = flatiron.app
  , path = require('path')
  , Backbone = require('backbone')
  , routerPlugin = require('../../lib/serverRouter')

// override backbone.sync
Backbone.sync = function(method, model, options){
  options.success()
}

require('chai').should()

app._base = __dirname
process.env.NODE_ENV = 'test'

app.config.file(path.join(__dirname, 'config.json'))

app.use(flatiron.plugins.http, {})
app.use(routerPlugin, {
  // all paths are relative to this directory
  base: __dirname
  // routes that are common client and server side
  , mutualRoutes: require('./routes.json')
  // routes that only the server will have (e.g. the routes that you'll go to get get JSON for your collections)
  , serverRoutes: require('./routesServer.json')
  // path to your collections
  , collections: './collections/'
  // path to your controllers
  , controllers: './controllers/'
})

module.exports = app
