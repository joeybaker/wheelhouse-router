'use strict';
var Backbone = require('backbone')

module.exports = Backbone.Model.extend({
  defaults: {
    name: 'main street'
    , lanes: 2
  }
})
