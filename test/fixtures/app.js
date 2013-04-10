/*global before, after */
'use strict';
var flatiron = require('flatiron')
  , app = flatiron.app
  , path = require('path')
  , _ = require('lodash')
  , Backbone = require('backbone')
  , routerPlugin = require('../../lib/serverRouter')

// override backbone.sync
Backbone.sync = function(method, model, options) {
  options.success()
}

require('chai').should()

app._base = __dirname
process.env.NODE_ENV = 'test'

app.config.file(path.join(__dirname, 'config.json'))

app.use(flatiron.plugins.http, {})
app.use(routerPlugin, {
  base: __dirname // all paths are relative to this directory
  , mutualRoutes: './routes.json' // routes that are common client and server side
  , serverRoutes: './routesServer.json' // routes that only the server will have (e.g. the routes that you'll go to get get JSON for your collections)
  , collections: './collections/' // path to your collections
  , controllers: './controllers/' // path to your controllers
})

module.exports = app
if (!app.server) app.start(app.config.get('port'))

// before(function(done){
//   console.log(app.config.get('port'))
//   if (!app.server) app.start(app.config.get('port'), done)
//   else done()
// })

// after(function(done){
//   // app.server.close()
//   app = undefined
//   done()
// })
