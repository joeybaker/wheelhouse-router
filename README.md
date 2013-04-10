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
    , controllers: 'controllers'
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
* actions are in the format of "controller#action", much like the Rails style router.


Only GET routes are used client side.

### routesServer.json
A companion routes file that has routes only the server will use. This is useful if you're have URLs that the client doesn't need/can't process. These might be:

* routes that return JSON for the client
* a login process
* POST, PUT, and DELETE requests

This is contained in a separate file so that the routes are never sent to the client.

### controller
Controllers are files that work both both client and server-side to tell a route what to do. It's assumed that mostly you'll want to get data from a collection and hand it off to a view. Controllers are modules that export an object with keys that are the actions. The values are functions that do any processing the controller needs to do.

In the the context of these actions is the typical connect-style request object. So, you've got `this.req`  and `this.res`. Ultimately should call `this.render(this, 'viewName', 'collectionName', {options})` or `this.res.end()` or `this.res.json()`.

#### params for `this.render`
* `this`: It's a bit sloppy right now, but you need to pass the current context over.
* `viewName`: the path of the Backbone view that you want to render. This is relative to the view path set when the router is configured.
* `collectionName`: the path of the Backbone collection. Relative to the collection path you set in the config.
* `options`: This will be passed to the view as it's options. In addition, you can specify a key `data`.

    * `data`: a function that gets the fetched collection passed in as the only argument. You can then map/reduce the collection and return a subset of the collection, a single model, or an arbitrary array or object. If you reduce down to a single model, that will get passed to the view as it's model (you'll be able to access the model in the view with `this.model`).

    * _Note_: `data` works both client and server side, but passing addtional options to the view only works client-side since on the server, the view is not processed, just the templates. This is on the docket of things to improve.


```js
// controllers/example.js

module.exports = {
  action: function(id){ // if the route has arguments on it, they get passed in here.
    this.render(this, 'viewName', 'collectionName', {
      data: function(collection){ // data is used to reduce the collection down.
        return collection.findWhere({id: id})
      }
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
