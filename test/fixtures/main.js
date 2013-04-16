'use strict';

window.$ = require('jquery')
window.Backbone = require('backbone')
window.Router = require('../../lib/clientRouter.js')
window.routes = require('./routes.json')

window.A = {}
window.router = new window.Router({
  routesJSON: window.routes
  , collections: 'collections/'
  , views: 'views/'
  , controllers: 'controllers/'
  , app: window.A
})

if (window.Backbone.history.start({pushState: true})) window.router.started = true
