'use strict';
var _ = require('lodash')
  , streetsCreate = function(){
    var json = []
    for (var i = 0, l = 10; i < l; i++){
      json[i] = {name: i + 'th street', id: i}
    }
    return json
  }
  , streets = streetsCreate()

module.exports = {
  get: function(id){
    if (id) return this.res.json(streets[id])
    this.res.json(streets)
  }

  , post: function(){
    var id = streets.length
    streets.push({name: this.req.body.name, id: id})
    this.res.json({id: id})
  }

  , put: function(id){
    var model = streets[parseInt(id, 10)]
    _.extend(model, this.req.body)
    streets[model.id] = model
    this.res.json({id: model.id})
  }

  , delete: function(id){
    streets[parseInt(id, 10)] = null
    this.res.end()
  }
}
