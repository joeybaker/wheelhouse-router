Wheelhouse Router
=======================

A wheelhouse package that unifies the [backbone router](http://backbonejs.org/#Router) with [flatiron's director](https://github.com/flatiron/director), so that you can write controllers that work both server and client side.

Currently requires [Browserify](https://github.com/substack/node-browserify)

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

If you prefer, you can specify much of the config in a flatiron config.json file. If you do this, you don't have to specify these options when configuring the plugin.

```json
// config.js
"paths": {
  "controllers": "controllers"
  , "templates": "templates"
  , "collections": "collections"
  , "models": "models"
  , "mutualRoutes": "routes.json"
  , "serverRoutes": "serverRoutes.json"
}
```


### Client JS
```js
// assets/js/main.js (client-side js)
// assumes you're using browserify

var Router = require('wheelhouse-router')
  , A = {}

  A.Router = new Router({
    routesJSON: require('./routes.json')
    , collections: 'collections/'
    , views: 'views/'
    , controllers: 'controllers/'
    , app: A
    , pushState: true
  })

```

Creating a new instance will automatically start `Backbone.history` with `pushState` enabled, but you can override that in the options.

You'll be able to access you raw and compiled Backbone objects attached to your app object (`A` in the example above. If you don't pass an `app` option, you can access this via `router.app`:
* `router.app.Views`: Raw Backbone views. (e.g. `new A.Views['home/index']`)
* `router.app.Renders`: Cached compiled views. (e.g. `A.Renders['home/index'].render()`)
* `router.app.Templates`: Templates
* `router.app.Collections`: Raw Backbone collections (e.g. `new A.Collections.streets`)
* `router.app.Datas`: Backbone collections with data (e.g. `A.Datas.streets.fetch()`)
* `router.app.Controllers`: Wheelhouse controllers. Probably not that useful external to the router.


### `app.router.render(reqObject, options, collection|model)`
This method gets attached to the main app router object. The rendered view gets saved in `router.Renders`. When a new router is triggered, the views events are automatically destoyed and a `remove` event is triggered on the view.

#### `reqObject`
When called from within a flatiron route: `this`

#### `options`
An object that can contain:
* data: data to pass to the view
* bootstrap: data to pass to the layout for boostrapping
* title: the title of the page
* meta: object for the page metadata

See below for more info.

#### `collection|model`
A backbone collection or model to hand off to the view. This is overriden by the data object, or passed off to data if data is a function.

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

### controllers
Controllers are files that work both both client and server-side to tell a route what to do. It's assumed that mostly you'll want to get data from a collection and hand it off to a view. Controllers are modules that export an object with keys that are the actions. The values are functions that do any processing the controller needs to do.

In the the context of these actions is the typical connect-style request object. So, you've got `this.req`  and `this.res`. Ultimately, you'll need to return an object that contains a view and any other options for the layout or simply call `this.res.end()` or `this.res.json()`.

#### the return object
##### view
The path of the Backbone view that you want to render. This is relative to the view path set when the router is configured.

```js
view: 'viewName'
```
##### collection
The path of the Backbone collection. Relative to the collection path you set in the config.

```js
collection: 'collectionName'
```

##### model
Only used client side. If specified, will get passed to the view. Define a function that receives the collection as it's sole argument. Return the model object.

```js
// route would be something like: /path/:id
get: function(id) {
…
  model: function(collection){
    return collection.get(id)
  }
…
}
```

##### data
A function that gets the fetched collection passed in as the only argument. You can then map/reduce the collection and return a subset of the collection, a single model, or an arbitrary array or object. The return value should be in JSON for the template to process.

This is only used server-side.

If not defined, it will use the `model.toJSON()`, if that's not defined, it will use `collection.toJSON()`

_example is the same as the model example_

##### bootstrap
You can hand JSON off to the template that will be used to bootstrap your collections client-side, as the handlebars attr `window._bootstrapData = {{{_data}}}`.

If not defined, it will use the `model.toJSON()`, if that's not defined, it will use `collection.toJSON()`

_example is the same as the model example_

##### title
Specify the `<title>` attribute

##### meta
An object that will be used to fill out the `<meta>` tags

##### user
This currently isn't configurable, but if the `req` object has a `user` object on it, it will be passed to the layout. If the `user` object has a `toJSON` method on it, that will be called.

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
      , bootstrap: function(collection){ // give backbone some initial data. Specify {{}}
        return collection.toJSON()
      }
      , model: function(collection){
        return collection.findWhere({id: id})
      }
    })
  }
  // another action, this one just returns json
  // note: this only works serverside
  , action2: function(){
    this.res.json({json: 'hello world'})
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

### The grunt way
You must have [grunt-cli](https://github.com/gruntjs/grunt-cli) installed: `sudo npm i -g grunt-cli`. This will run both server and client-side tests.
`grunt test`

### The Mocha way
This only tests server-side tests.
`mocha test/specs -ui bdd`
