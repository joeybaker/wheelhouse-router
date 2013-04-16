'use strict';
var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  el: '#app'
  , template: 'street index view'
  , render: function(){
    this.$el.html(this.template)
  }
})
