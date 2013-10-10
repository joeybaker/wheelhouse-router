'use strict';

window.$ = require('jquery')
window._ = require('lodash')
window.Backbone = require('backbone')
window.Router = require('../../lib/clientRouter.js')
window.routes = require('./routes.json')
window.Backbone.$ = window.$

window.A = {}
window.router = new window.Router({
  routesJSON: window.routes
  , collections: 'collections/'
  , views: 'views/'
  , controllers: 'controllers/'
  , app: window.A
})

