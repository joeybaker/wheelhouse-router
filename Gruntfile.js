'use strict';
var path = require('path')

module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
    , config: grunt.file.readJSON('test/fixtures/config.json')
    , meta: {
      version: '<%= pkg.version %>'
      , banner: '/*! <%= pkg.name %> - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n'
    }
    , jshint: {
      all: [
        'Gruntfile.js'
        , 'index.js'
        , 'lib/**/*.js'
        , 'test/**/*.js'
      ]
      , options: {
        jshintrc: '.jshintrc'
      }
    }
    , bump: {
      patch: {
        options: {
          part: 'patch'
        }
        , src: [
          'package.json'
        ]
      }
      , minor: {
        options: {
          part: 'minor'
        }
        , src: '<%= bump.patch.src %>'
      }
      , major: {
        options: {
          part: 'major'
        }
        , src: '<%= bump.patch.src %>'
      }
    }
    , browserify2: {
      test: {
        entry: './test/fixtures/main.js'
        , debug: true
        , compile: './test/fixtures/main.compiled.js'
        , beforeHook: function(bundle){
          var shim = require('browserify-shim')

          // make files nicer to require
          // anything in the JS dir
          // grunt.file.recurse('./test/fixtures/', function(abspath){
          //   bundle.require(require.resolve(path.join(__dirname, abspath)), {expose: abspath.replace('test/fixtures/', '').replace('.js', '')})
          // })
          // // templates can be accessed via `templates/**`
          // grunt.file.recurse('./assets/_js/templates/', function(abspath){
          //   bundle.require(require.resolve(path.join(__dirname, abspath)), {expose: abspath.replace('assets/_js/', '').replace('.js', '')})
          // })
          // // controllers can be fetched via `controllers/**`
          // // also, collections and models
          grunt.util._.each(['collections', 'controllers', 'models', 'views'], function(dir){
            grunt.file.recurse('./test/fixtures/' + dir, function(abspath){
              if (abspath.indexOf('api/') === -1) bundle.require(require.resolve(path.join(__dirname, abspath)), {expose: abspath.replace('test/fixtures/', '').replace('.js', '')})
            })
          })
          // // views
          // // remove underscores from the front, so that partials are nicer to require
          // grunt.file.recurse('./app/views/', function(abspath){
          //   bundle.require(require.resolve(path.join(__dirname, abspath)), {expose: abspath.replace('app/', '').replace('.js', '').replace('/_', '/')})
          // })
          // // handlebars helpers built into wheelhouse-handlebars fetched via `helpers/**`
          // grunt.file.recurse('./node_modules/wheelhouse-handlebars/lib/helpers/', function(abspath){
          //   bundle.require(require.resolve(path.join(__dirname, abspath)), {expose: abspath.replace('node_modules/wheelhouse-handlebars/lib/', '').replace('.js', '')})
          // })

          // we need to shim some libraries to get things playing nicely
          shim(bundle, {
            // jquery isn't commonJS compatible at all
            jquery: {path: './node_modules/jquery-browser/lib/jquery.js', exports: '$'}
            // , handlebars: {path: './assets/components/handlebars/handlebars.runtime.js', exports: 'Handlebars'}
          })
            // make up for using bower instead of npm
            // replace underscore with lodash
            // .require(require.resolve('./assets/components/lodash/dist/lodash.js'), {expose: 'underscore'})
            // .require(require.resolve('./node_modules/jquery/jquery.js'), {expose: 'jquery'})
            .require(require.resolve('./node_modules/handlebars/dist/handlebars.runtime.js'), {expose: 'handlebars'})

        }
      }
    }
    , simplemocha: {
      options: {
        timeout: 2000
        , ignoreLeaks: true
        , ui: 'bdd'
      }
      , all: {
        src: ['test/specs/**/*.js']
      }
    }
    , mocha: {
      all: {
        options: {
          run: true
          , urls: ['http://localhost:<%= connect.test.options.port %>/js-tests']
        }
      }
    }
    , connect: {
      test: {
        options: {
          port: '<%= config.port + 10001 %>'
          // , keepalive: true
          , middleware: function(connect) {
            return [
              connect.static(path.join(__dirname, '.'))
              , function(req, res) {
                var Handlebars = require('handlebars')
                  , request = require('request')
                  , specs = []
                  , template

                // TODO: match changed files against specs so that we're sure to only run necessary tests
                // console.log(grunt.regarde.changed)

                console.log(req.url)
                // proxy through calls to the api controller so that the test server can get data
                if (req.url.indexOf('/api') > -1) {
                  request('http://localhost:<%= config.port %>' + req.url, function(err, result, body) {
                    if (err) throw err

                    res.end(body)
                  })
                }
                // hardcoded route for the test runner
                else if (req.url === '/js-tests') {
                  grunt.file.recurse('./test/client/specs/', function(abspath){
                    if (/\.js$/.test(abspath)) specs.push(abspath)
                  })

                  template = Handlebars.compile(grunt.file.read('test/client/test.hbs'))
                  res.end(template({specs: specs}))
                }
              }
            ]
          }
        }
      }
    }
    , shell: {
      gitTag: {
        command: 'git tag v<%= grunt.file.readJSON("package.json").version %>'
        , options: {
          stdout: true
          , failOnError: true
        }
      }
      , gitRequireCleanTree: {
        command: 'function require_clean_work_tree(){\n' +
          ' # Update the index\n' +
          '    git update-index -q --ignore-submodules --refresh\n' +
          '    err=0\n' +

          ' # Disallow unstaged changes in the working tree\n' +
          '    if ! git diff-files --quiet --ignore-submodules --\n' +
          '    then\n' +
          '        echo >&2 "cannot $1: you have unstaged changes."\n' +
          '        git diff-files --name-status -r --ignore-submodules -- >&2\n' +
          '        err=1\n' +
          '    fi\n' +

          ' # Disallow uncommitted changes in the index\n' +
          '    if ! git diff-index --cached --quiet HEAD --ignore-submodules --\n' +
          '    then\n' +
          '        echo >&2 "cannot $1: your index contains uncommitted changes."\n' +
          '        git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2\n' +
          '        err=1\n' +
          '    fi\n' +

          '    if [ $err = 1 ]\n' +
          '    then\n' +
          '        echo >&2 "Please commit or stash them."\n' +
          '        exit 1\n' +
          '    fi\n' +
          '} \n require_clean_work_tree'
        , options: {
          failOnError: true
        }
      }
      , gitCommitPackage: {
        command: 'git commit --amend -i package.json --reuse-message HEAD'
        , options: {
          stdout: true
          , failOnError: true
        }
      }
      , gitPush: {
        command: 'git push origin master --tags'
        , options: {
          stdout: true
          , failOnError: true
        }
      }
      , npmPublish: {
        command: 'npm publish'
        , options: {
          stdout: true
          , failOnError: true
        }
      }
      , npmTest: {
        command: 'npm test'
        , options: {
          stdout: true
          , failOnError: true
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-simple-mocha')
  grunt.loadNpmTasks('grunt-browserify2')
  grunt.loadNpmTasks('grunt-notify')
  grunt.loadNpmTasks('grunt-mocha')
  grunt.loadNpmTasks('grunt-shell')
  grunt.loadNpmTasks('grunt-bumpx')

  grunt.registerTask('test', ['simplemocha', 'browserify2', 'connect:test', 'mocha'])
  grunt.registerTask('publish', ['shell:gitRequireCleanTree', 'jshint', 'shell:npmTest', 'bump:' + (grunt.option('bump') || 'patch'), 'shell:gitCommitPackage', 'shell:gitTag', 'shell:gitPush', 'shell:npmPublish'])
}
