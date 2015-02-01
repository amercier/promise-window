/*jshint browser:false, node:true */

// Karma test runner configuration
// see http://karma-runner.github.io/0.12/config/configuration-file.html

module.exports = function(config) {
  'use strict';

  console.info('========== ' + (process.env.SUITE || 'native') + ' ==========\n');

  config.set({
    frameworks: [ 'qunit', 'sinon' ],
    files: (
        process.env.SUITE === 'native'
        ? []
        : ['tests/config/disable-native-promise.js']
      ).concat([
        'tests/config/karma-init.js',
        'bower_components/bind-polyfill/index.js',
        {
          native: 'bower_components/promise-polyfill/Promise.js',
          jquery: 'bower_components/jquery/dist/jquery.js',
          rsvp: 'bower_components/rsvp/rsvp.js',
          q: 'bower_components/q/q.js'
        }[process.env.SUITE || 'native'],
        { pattern: 'tests/stubs/*.html', watched: true, included: false, served: true },
        'src/promise-window.js',
        'tests/*.test.js'
      ]),
    browsers: process.env.CI ? [ 'PhantomJS' ] : [ 'Chrome', 'PhantomJS_debug' ],
    reporters: process.env.CI ? [ 'dots' ] : [ 'progress' ],
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
