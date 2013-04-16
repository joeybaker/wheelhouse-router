'use strict';
var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  el: '#app'
  , template: 'home view'
  , render: function(){
    this.$el.html(this.template)
  }
})
