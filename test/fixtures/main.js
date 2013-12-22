/*global mocha*/
'use strict';

var Backbone

window.$ = require('jquery')
window._ = require('lodash')
window.Backbone = Backbone = require('backbone')
window.Router = require('../../lib/clientRouter.js')
window.routes = require('./routes.json')
window.Backbone.$ = window.$
window.sinon = require('sinon')
window.sinonChai = require('sinon-chai')
window.killBackbone = function(){
  // reset backbone.history
  Backbone.history.stop()
  Backbone.history.handlers = []
  Backbone.history._starting = false
  Backbone.history.fragment = undefined
  Backbone.History.started = false
}

window.chai.use(window.sinonChai)

window.A = {}

setTimeout(function(){
  mocha.run()
})
