'use strict';
var Backbone = require('backbone')

module.exports = Backbone.View.extend({
  el: '#app'
  , template: 'street detail view'
  , render: function(){
    console.log(this.options, this.model, this.collection)
    this.$el.html(this.template)
  }
})
