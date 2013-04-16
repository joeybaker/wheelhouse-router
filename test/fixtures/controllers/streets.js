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
      , model: function(collection){
        return collection.findWhere({name: street})
      }
      , data: function(collection){
        var model = collection.findWhere({name: street})
        return model ? model.toJSON() : {}
      }
    }
  }
}

