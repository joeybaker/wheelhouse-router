'use strict';

module.exports = {
  index: function(){
    return {
      view: 'streets/index'
      , collection: 'streets'
      , data: function(collection){
        return {streets: collection.toJSON()}
      }
    }
  }
  , detail: function(street){
    return {
      view: 'streets/detail'
      , collection: 'streets'
      , data: function(collection){
        return collection.findWhere({name: street}).toJSON()
      }
    }
  }
}

