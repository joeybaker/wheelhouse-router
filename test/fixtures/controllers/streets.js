'use strict';

module.exports = {
  index: function(){
    this.render(this, 'streets/index', 'streets', {
      data: function(collection){
        return {streets: collection.toJSON()}
      }
    })
  }
  , detail: function(street){
    this.render(this, 'streets/detail', 'streets', {
      data: function(collection){
        return collection.findWhere({name: street})
      }
    })
  }
}

