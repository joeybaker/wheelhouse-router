'use strict';

var apiDo = function(){
  return 'api value'
}

module.exports = {
  index: function(done){
    this.res.write(apiDo())
    done()
  }
}
