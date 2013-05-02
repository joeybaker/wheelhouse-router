'use strict';
var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  el: '#app'
  , template: 'street detail view'
  , render: function(){
    this.$el.html(this.template)
  }
})
