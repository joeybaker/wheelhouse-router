Wheelhouse Router
=======================

A wheelhouse package that unifies the [backbone router](http://backbonejs.org/#Router) with [flatiron's director](https://github.com/flatiron/director), so that you can write controllers that work both server and client side.

## Usage

### Server

```js
// app.js
var flatiron = require('flatiron')
  , app = flatiron.app
  , path = require('path')
  , st = require('st') // needed for flation's static plugin
  , routerPlugin = require('wheelhouse-router')


app.use(flatiron.plugins.http, {})

// You probably want to use flatiron's static plugin to server your client-side JS/CSS
app.use(flatiron.plugins.static, {
  url: 'assets'
  , dir: path.join(__dirname, 'assets') // assumes a directory at the root of your app called "assets", which could contain main.js, main.css, etc…
  , cache: app.env !== 'development' // turn off the cache in development.
})

app.use(routerPlugin, {
  base: __dirname // all paths are relative to this directory
  , mutualRoutes: './routes.json' // routes that are common client and server side
  , serverRoutes: './routesServer.json' // routes that only the server will have (e.g. the routes that you'll go to get get JSON for your collections)
  , collections: './collections/' // path to your collections
  , controllers: './controllers/' // path to your controllers
  , render: function(viewName, viewData, layoutOptions){} // defaults to app.render
  , err404: 'err/404' // the path to your 404 template
})

app.start(8999)
```

### Client JS
```js
// assets/js/main.js (client-side js)
// assumes you're using browserify

var Router = require('wheelhouse-router')
window.A = { // a global object to hold all of our app
  Views: {} // raw views, call with `var view = new A.Views.view`
  , Templates: {} // raw templates
  , Collections: {} // raw collections
  , Models: {} // raw models
  , Datas: {} // created collections, will actually have data.
  , Renders: {} // created views, this is a saved generated view
  , Router: new Router({
    routesJSON: require('app/routes.json')
    , collections: 'collections/'
    , views: 'views/'
    , controllers: 'controllers/'
    , app: window.A
  })
  , init: function(){
    if (Backbone.history.start({pushState: true})) A.Router.started = true
  }
}

A.init()

```

### routes.json
A JSON file that defines the routes.

```js
// the format
// route: {method: controller#action}
{
  "(/)": {"get": "home#index"}
  , "streets(/)": {"get": "streets#index"}
  , "streets/*": {"get": "streets#detail"
    , "post": "streets#create"
  }
}
```

* Routes are defined in a style much like [Backbone's Router](http://backbonejs.org/#Router-routes). The only exception is that splats are just `*` not `*splat`.
* Routes are keys, the values are objects that contain keys of methods and values that are strings of the controller and action to call.
* Methods are the standard HTTP methods: get, post, put, delete
* actions are in the format of "controller#action", much like the Rails style router. If an action is not specified, it will default to the method.


Only GET routes are used client side.

### routesServer.json
A companion routes file that has routes only the server will use. This is useful if you're have URLs that the client doesn't need/can't process. These might be:

* routes that return JSON for the client
* a login process
* POST, PUT, and DELETE requests

This is contained in a separate file so that the routes are never sent to the client.

### controller
Controllers are files that work both both client and server-side to tell a route what to do. It's assumed that mostly you'll want to get data from a collection and hand it off to a view. Controllers are modules that export an object with keys that are the actions. The values are functions that do any processing the controller needs to do.

In the the context of these actions is the typical connect-style request object. So, you've got `this.req`  and `this.res`. Ultimately, you'll need to return an object that contains a view and any other options for the layout or simply call `this.res.end()` or `this.res.json()`.

#### the return object
* `view`: the path of the Backbone view that you want to render. This is relative to the view path set when the router is configured.
* `collection`: the path of the Backbone collection. Relative to the collection path you set in the config.
* `model`: only used client side. If specified, will get passed to the view.
* `data`: a function that gets the fetched collection passed in as the only argument. You can then map/reduce the collection and return a subset of the collection, a single model, or an arbitrary array or object. The return value should be in JSON for the template to process.
* `bootstrap`: you can hand JSON off to the template that will be used to bootstrap your collections client-side
* `title`: specify the `<title>` attribute
* `meta`: an object that will be used to fill out the `<meta>` tags
* _Note_: additional params only works client-side since on the server, the view is not processed, just the templates. This is on the docket of things to improve.


```js
// controllers/example.js

module.exports = {
  action: function(id){ // if the route has arguments on it, they get passed in here.
    return {
      view: 'viewName'
      , collection: 'collectionName'
      , title: 'title of the page'
      , meta: {
        description: 'A meta description'
      }
      , data: function(collection){ // data is used to reduce the collection down, you should return JSON for your templates
        return collection.findWhere({id: id}).toJSON()
      }
      , bootstrap: function(collection){ // give backbone some initial data
        return collection.toJSON()
      }
      , model: function(collection){
        return collection.findWhere({id: id})
      }
    })
  }
}


```

### server controllers
Sometimes it's necessary to have the server do things the client shouldn't be aware of. To get that done, there are server-side controllers. These are files that live in the controller directory, and have 'Server' appended to their name. For example, if you have a controller named `controllers/home.js`, and want to do some server-side only processing, create a controller named `controllers/homeServer.js`.

Server controllers get called after regular controllers and are passed all the arguments of the regular controller with two args appended on: the collection (or model if specified), and a callback. You must call the callback when done.

```js
// controllers/exampleServer.js

module.exports = {
  action: function(id /* [*args] */, collection, callback){
    var done = _.after(collection.length, callback)

    collection.each(function(model){
      model.save({number: model.get('number') + 10})
      done()
    })
  }
}
```

## tests
_Note_ Client side tests aren't done yet.

### The grunt way
You must have [grunt-cli](https://github.com/gruntjs/grunt-cli) installed: `sudo npm i -g grunt-cli`
`npm test`

### The Mocha way
`mocha test/specs -ui bdd`
