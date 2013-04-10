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

### controller
```js
```

## tests

### The grunt way
You must have [grunt-cli](https://github.com/gruntjs/grunt-cli) installed: `sudo npm i -g grunt-cli`
`npm test`

### The Mocha way
`mocha test/specs -ui bdd`
