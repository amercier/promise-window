/*jshint browser:false, node:true */

// Karma test runner configuration
// see http://karma-runner.github.io/0.12/config/configuration-file.html

module.exports = function(config) {
  'use strict';

  console.info('========== ' + (process.env.SUITE || 'native') + ' ==========\n');

  config.set({
    frameworks: [ 'qunit', 'sinon' ],
    files: [
        'tests/config/karma-init.js',
        'bower_components/bind-polyfill/index.js'
      ].concat(
        {
          jquery: ['bower_components/jquery/dist/jquery.js'],
          rsvp: ['bower_components/rsvp/rsvp.js'],
          q: ['bower_components/q/q.js'],
          native: [
            'tests/config/disable-native-promise.js',
            'bower_components/promise-polyfill/Promise.js'
          ],
          'native-amd': [
            'tests/config/disable-native-promise.js',
            'bower_components/promise-polyfill/Promise.js',
            'bower_components/requirejs/require.js'
          ],
          'promise-provider-aplus': [
            'bower_components/vow/lib/vow.js',
            'tests/config/promise-provider-aplus.js'
          ],
          'promise-provider-custom': [
            'bower_components/ayepromise/ayepromise.js',
            'tests/config/promise-provider-custom.js'
          ]
        }[process.env.SUITE || 'native']
      ).concat([
        { pattern: 'tests/stubs/*', watched: true, included: false, served: true },
        'src/promise-window.js',
        'tests/*.test.js'
      ]),
    browsers: process.env.CI ? [ 'PhantomJS' ] : [ 'Chrome', 'PhantomJS_debug' ],
    reporters: process.env.CI ? [ "dots", "coverage" ] : [ "progress" ],
    preprocessors: !process.env.CI ? {} : {
      "src/**/*.js": [ "coverage" ]
    },
    coverageReporter: !process.env.CI ? {} : {
      dir: "tests/coverage",
      reporters: [
        { type: "json", subdir: ".", file: "coverage-" + (process.env.SUITE) + ".json" }
      ]
    },
    customLaunchers: process.env.CI ? {} : {
      'PhantomJS_debug': {
        base: 'PhantomJS',
        options: {
          windowName: 'Custom PhantomJS',
          settings: {
            webSecurityEnabled: false
          }
        },
        flags: [
          '--remote-debugger-port=9000',
          '--remote-debugger-autorun=yes',
          '--debug=true'
        ]
      }
    },
    singleRun: !!process.env.CI,
    autoWatch: !process.env.CI
  });
};
