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
    , jscs: {
      options: {}
      , all: '<%= jshint.all %>'
    }
    , bump: {
      options: {
        tabSize: 2
      }
      , files: ['package.json']
    }
    , watchify: {
      options: {
        callback: function(b){
          var aliasMap
            , aliasMappings

          aliasMap = function aliasMap(alias){
            alias.expand = true; // so the user doesn't have to specify
            grunt.file.expandMapping(alias.src, alias.dest, alias)
              .forEach(function(file){
                var expose = file.dest.substr(0, file.dest.lastIndexOf('.'))
                b.require(path.resolve(file.src[0]), {expose: expose})
              })
          }

          b.require('handlebars/dist/handlebars.runtime.js', {
            expose: 'handlebars'
          })

          aliasMappings = [
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

          aliasMappings.forEach(function(alias){
            aliasMap(alias)
          })

          return b
        }
        , debug: true
      }
      , test: {
        src: './test/fixtures/main.js'
        , dest: './test/fixtures/main.compiled.js'
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
    , karma: {
      options: {
        configFile: 'karma.conf.js'
        , runnerPort: 9021
        , mocha: {
          ui: 'bdd'
        }
      }
      , watch: {
        singleRun: false
        , autoWatch: true
      }
      , publish: {
        singleRun: true
        , autoWatch: false
        , browsers: ['Firefox', 'Safari', 'Chrome']
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
        command: 'git commit -i -s package.json -m"v<%= grunt.file.readJSON("package.json").version %>"'
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
      , gitPullRebase: {
        command: 'git pull --rebase origin master'
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
      , nodemonServerTest: {
        command: 'nodemon -x mocha -w lib -w test/server -- test/server'
        , options: {
          stdout: true
          , stderr: true
          , failOnError: false
        }
      }
    }
  })

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.registerTask('test', function(){
    if (this.args.indexOf('client') > -1)
      grunt.task.run(['watchify', 'karma:' + (grunt.option('watch') ? 'watch' : 'publish')])
    else if (this.args.indexOf('server') > -1)
      grunt.task.run([grunt.option('watch') ? 'shell:nodemonServerTest' : 'simplemocha'])
    else
      grunt.task.run(['watchify', 'simplemocha', 'karma:publish'])
  })

  grunt.registerTask('publish', 'create a tag and publish to npm', function(){
    var bump = (grunt.option('bump') || grunt.option('level') || 'patch')
    grunt.option('level', bump)
    grunt.log.writeln(('Publishing a ' + bump + ' version').yellow)

    grunt.task.run([
      'shell:gitRequireCleanTree'
      , 'shell:gitPullRebase'
      , 'jshint'
      , 'jscs'
      , 'shell:npmTest'
      , 'bump'
      , 'shell:gitCommitPackage'
      , 'shell:gitTag'
      , 'shell:gitPush'
      , 'shell:npmPublish'
    ])
  })
}
