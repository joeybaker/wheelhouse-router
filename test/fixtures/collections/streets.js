'use strict';
var Backbone = require('backbone')
  , model = require('../models/street')

module.exports = Backbone.Collection.extend({
  url: '/api/streets'
  , model: model
})
