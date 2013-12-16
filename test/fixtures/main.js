/*global mocha*/
'use strict';

window.$ = require('jquery')
window._ = require('lodash')
window.Backbone = require('backbone')
window.Router = require('../../lib/clientRouter.js')
window.routes = require('./routes.json')
window.Backbone.$ = window.$
window.sinon = require('sinon')
window.sinonChai = require('sinon-chai')

window.chai.use(window.sinonChai)

window.A = {}

window.router = new window.Router({
  routesJSON: window.routes
  , collections: 'collections/'
  , views: 'views/'
  , controllers: 'controllers/'
  , app: window.A
})

setTimeout(function(){
  mocha.run()
})
