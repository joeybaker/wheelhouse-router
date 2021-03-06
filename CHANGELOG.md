# Changelog
### 0.6.0
* migrated client tests to karma and watchify. now with moar speed!
* client: fixed a bug where `_addRoutes` wouldn't render
* client: no longer reserving certain action names
* client: controllers now has access to `this.req.user` & `this.res.redirect`

### 0.5.15
Client: Ensure the current render is fully removed when changing renders

### 0.5.14
Server: the render function is called with the request context.

### 0.5.13
Client: hacky fix to ensure the modified URL of a fetch doesn't overwrite model urls.

### 0.5.12
Server: error templates go through the same build process as regular templates now.

### 0.5.11
Server: router won't show an error page or set headers if the user has done it already. This is useful if you'd rather redirect then show an error page.

### 0.5.10
Fix 0.5.9, actually don't override the collection url

### 0.5.9
* client: fix `options.url` overriding collection url

### 0.5.8
IE8 bug fix: url params now get passed to the view correctly

### 0.5.7
* fix `title` option, now works
* update server route logging to show user id, not user email (makes it slighly more generic anyway)

### 0.5.5 && 0.5.6
Update publish command.

### 0.5.4
IE8 compatibility for the client router.

### 0.5.3
* **fix bug** correct client router failing to fetch
* now allowing boostrap data to be explicitly disabled in the controller by setting `boostrap: false`

## 0.5.2
* fix 5** errors not logging a stack trace but all other errors did.
* test cleanup
* the app now has the `_initialRouteHasFired` boolean, which is set to `true` as soon as the first route matches. This might be useful for ignoring the first page load in Google Analytics.
* fix options being overridden before being passed to `render`

## 0.5.1
* split changelog into a separate file
* bug fix for multiple routers not properly loading a new url
* **breaking change**: no longer storing the fragment for `/`, which Backbone stores as `''`, as `'home'`. Just use `'/'`

## 0.5.0
* add option to not auto-start the router. This seems to be mostly useful for testing.
* add a `rotuer#start` method, which enable the user to manually start the router.
* **breaking change**: when adding routes manually, the router no longer manually restarts. You'll have to call `router.start()`
* Routers are now assigned a `cid`
* **breaking change**: the app object no longer contains a `Router`. It's been replaced with `Routers`, an array that lists routers by `cid`.

## 0.4.13
* Only log a stack trace on a 500 error. We don't need traces for 4** errors.

## 0.4.12
* Major refactor of the serverRouter. The code is much easier to read and is much better about alerting users to errors in their config.
* Start on unit tests for the server router (we already have integration tests)
* Return a 200 status and headers by default
* *minor breaking change*: no longer setting the err templates by default

## 0.4.11
* Update a lot of dependencies. __note:__ backbone and browserify remain locked to old versions for compatiblity reasons.
* Defer the start of routing until the event loop is done processing, we're sure that the router object has been created and assigned to a variable. This ensures that the router's variable will be available to the views it renders.

## 0.4.10
* Bug fix: client router didn't properly set the `_currentRender`

## 0.4.8
* Router used to store the current url and rendered view on the router itself, but this broke in an environment where there were multiple routers. So, store those on the app object.

## 0.4.7
* client router shouldn't care about the `data` option. Deprecate the code that does care about it.
* `_setCollection` overwrites previous data. Previously, `_setCollection` assumed that a collection with data in it should not be overwritten. Change this behavior to assume that when `_setCollection` is given data to pass to the collection, we want to overwrite any pre-existing data. This is especially useful if a previous router has created the collection, but entered no or bad data.

## 0.4.5
* Bug fix for options not always passing the the collection client side

## 0.4.0
* expose a `permissions` method for the server to be able to handle route permissions
* **breaking change** routes are now handed to the server as fully qualified JSON, instead of a path
* **breaking change** the server-side `err` option is now an object instead of a string so that we can specify more than one type of error
* The director `on` and `before` methods are now exposed in the server options
* **breaking change** no longer fetching the collection on every request if `app.collections` has the collection for the route. This should be a major speed up.
* server-side can now specify a template path if you want to override the view path
