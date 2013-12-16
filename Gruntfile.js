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
        , '!**/**.compiled.js'
      ]
      , options: {
        jshintrc: '.jshintrc'
      }
    }
    , bump: {
      patch: {
        options: {
          part: 'patch'
          , tabSize: 2
        }
        , src: [
          'package.json'
        ]
      }
      , minor: {
        options: {
          part: 'minor'
          , tabSize: 2
        }
        , src: '<%= bump.patch.src %>'
      }
      , major: {
        options: {
          part: 'major'
          , tabSize: 2
        }
        , src: '<%= bump.patch.src %>'
      }
    }
    , browserify: {
      test: {
        src: './test/fixtures/main.js'
        , dest: './test/fixtures/main.compiled.js'
        , options: {
          debug: true
          , shim: {
            jquery: {
              path: './node_modules/jquery-browser/lib/jquery.js'
              , exports: '$'
            }
          }
          , alias: [
            './node_modules/handlebars/dist/handlebars.runtime.js:handlebars'
          ]
          , aliasMappings: [
            {
              cwd: './test/fixtures/collections'
              , src: ['**/*.js']
              , dest: 'collections'
            }
            , {
              cwd: './test/fixtures/controllers'
              , src: ['**/*.js']
              , dest: 'controllers'
            }
            , {
              cwd: './test/fixtures/models'
              , src: ['**/*.js']
              , dest: 'models'
            }
            , {
              cwd: './test/fixtures/views'
              , src: ['**/*.js']
              , dest: 'views'
            }
          ]
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
        src: ['test/server/**/*.js']
      }
    }
    , mocha: {
      all: {
        options: {
          run: false
          , urls: ['http://localhost:<%= connect.test.options.port %>/']
          , log: true
        }
      }
    }
    , connect: {
      test: {
        options: {
          port: '<%= config.port + 1 %>'
          // , keepalive: true
          , middleware: function(connect) {
            return [
              connect.static(path.join(__dirname, '.'))
              , function(req, res) {
                var Handlebars = require('handlebars')
                  , specs = []
                  , template

                // TODO: match changed files against specs so that we're sure to only run necessary tests
                // console.log(grunt.regarde.changed)

                // console.log(req.url)
                // proxy through calls to the api controller so that the test server can get data
                if (req.url.indexOf('/api') > -1) {

                  res.end(JSON.stringify([{name: 'street1', id: 1}, {name: 'street 2', id: 2}]))
                }
                // always just run the clientside tests
                else {
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
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-notify')
  grunt.loadNpmTasks('grunt-mocha')
  grunt.loadNpmTasks('grunt-shell')
  grunt.loadNpmTasks('grunt-bumpx')

  grunt.registerTask('test', function(){
    if (grunt.option('client'))
      grunt.task.run(['browserify', 'connect:test', 'mocha'])
    else if (grunt.option('server'))
      grunt.task.run(['simplemocha'])
    else
      grunt.task.run(['browserify', 'connect:test', 'simplemocha', 'mocha'])
  })
  grunt.registerTask('publish', ['shell:gitRequireCleanTree', 'jshint', 'shell:npmTest', 'bump:' + (grunt.option('bump') || 'patch'), 'shell:gitCommitPackage', 'shell:gitTag', 'shell:gitPush', 'shell:npmPublish'])
}
