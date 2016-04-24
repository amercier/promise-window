/**
 * PromiseWindow
 * https://github.com/amercier/promise-window
 * @ignore
 */
(function() {
  'use strict';

  var root = window,
      prototype,
      html = root.document.documentElement;

  /**
   * Merge the contents of two or more objects together into the first object.
   *
   *     merge( target [, object1 ] [, objectN ] )
   *
   * @param {Object} target  An object that will receive the new properties if
   *                         additional objects are passed in.
   * @param {Object} object1 An object containing additional properties to merge in.
   * @param {Object} objectN An object containing additional properties to merge in.
   * @return {Object} Returns the first object.
   * @ignore
   */
  function extend() {
    var extended = arguments[0], key, i;
    for (i = 1; i < arguments.length; i++) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          extended[key] = arguments[i][key];
        }
      }
    }
    return extended;
  }

  /**
   * Generates a pseudo-unique String
   *
   * @param  {String} prefix Optional.
   * @return {String} Returns a pseudo-unique string prefixed with the given prefix, if any.
   * @ignore
   */
  function generateUniqueString(prefix) {
    return prefix + new Date().getTime() + "-" + Math.floor(10e12 * Math.random());
  }

  /**
   * Create a new PromiseWindow object
   *
   * During the lifecycle of this object, popup windows can be opened, closed,
   * and reopened again. However, it'
   *
   * Instanciating this prototype does not immediately opens a new popup window.
   * To open the window, use `open()` on the created object.
   *
   * @param {String}   uri                    Destination URI
   * @param {Object}   config                 Configuration object. See description below.
   * @param {Number}   config.width           Width of the popup window. Defaults to the current document width.
   * @param {Number}   config.height          Height of the popup window. Defaults to the current document height.
   * @param {Function} config.promiseProvider Promise provider. Should return a plain object containing 3 fields:
   *                                          - `promise` {Promise}  a new Promise object
   *                                          - `resolve` {Function} the method to resolve the given Promise
   *                                          - `reject`  {Function} the method to reject the given Promise
   * @param {Function} config.onPostMessage   Handler for receiving a postMessage from the opened window. Default
   *                                          implementation resolves the promise with the data passed in the post
   *                                          message, except if this data contains an `error` field. In this case,
   *                                          it rejects the Promise with the value of that field. In all cases, closes
   *                                          the popup window.
   * @param {Function} config.onPostMessage.event Event The postMessage event
   * @param {Number}   config.watcherDelay    There is no programmatic way of knowing when a popup window is closed
   *                                          (either manually or programatically). For this reason, every time
   *                                          PromiseWindow opens a popup, a new watcher is created. The watcher checks
   *                                          regularly if the window is still open. This value defines at which
   *                                          interval this check is done. Defaults to 100ms.
   * @param {String}   config.windowName      Name to be ginven to the popup window. See `window.open` references for
   *                                          details. If `null`, a random name is generated.
   * @param {Object}   config.window          Object containing window configuration settings. Scrollbars are enabled
   *                                          by default. All `window.open` ptions are accepted, but please note that
   *                                          many of them have no effect in most modern browsers. See
   *                                          https://developer.mozilla.org/en-US/docs/Web/API/Window/open for more
   *                                          details.
   * @constructor
   */
  function PromiseWindow(uri, config) {
    this.uri = uri;
    this.config = extend({}, this.constructor.defaultConfig, config);
    this.config.windowName = this.config.windowName || generateUniqueString('promise-window-');
    this._onPostMessage = this._onPostMessage.bind(this);
  }

  /**
   * Create a Promise provider from a Promise/A+ constructor to be used with
   * `config.promiseProvider`.
   *
   *     new PromiseWindow(..., {
   *       ...,
   *       promiseProvider: PromiseWindow.getAPlusPromiseProvider(MyCustomPromise)
   *     });
   *
   * @param  {Function} CustomPromise Promise/A+ contructor
   * @return {Function} Returns a promise provider
   * @static
   */
  PromiseWindow.getAPlusPromiseProvider = function getAPlusPromiseProvider(CustomPromise) {
    return function promiseProvider() {
      var module = {};
      module.promise = new CustomPromise(function(resolve, reject) {
        module.resolve = resolve;
        module.reject = reject;
      });
      return module;
    };
  };

  /**
   * Convenience method for:
   *
   *     new PromiseWindow(uri, config).open()
   *
   * Use this method only if you never need to close the window programatically.
   * If you do, please consider using the classic way:
   *
   *     var w = new PromiseWindow(uri, config)
   *     w.open();
   *     // ...
   *     w.close();
   *
   * @return {Promise} Returns a Promise equivalent to the one returned by `open()`
   * @static
   */
  PromiseWindow.open = function open(uri, config) {
    return new PromiseWindow(uri, config).open();
  };

  /**
   * Default configuration
   * @type {Object}
   */
  PromiseWindow.defaultConfig = {
    width: html.clientWidth,
    height: html.clientHeight,
    window: {
      scrollbars: true
    },
    watcherDelay: 100,
    promiseProvider: null,
    onPostMessage: function onPostMessage(event) {
      if (event.data.error) {
        this._reject(event.data.error);
      } else {
        this._resolve(event.data);
      }
      this.close();
    },
    windowName: null
  };

  // Configure default Promise provider from current invironment
  if (root.Promise) {
    PromiseWindow.defaultConfig.promiseProvider = PromiseWindow.getAPlusPromiseProvider(root.Promise);
  }
  else if (root.RSVP) {
    PromiseWindow.defaultConfig.promiseProvider = PromiseWindow.getAPlusPromiseProvider(root.RSVP.Promise);
  }
  else if (root.Q) {
    PromiseWindow.defaultConfig.promiseProvider = PromiseWindow.getAPlusPromiseProvider(root.Q.Promise);
  }
  else if (root.jQuery) {
    PromiseWindow.defaultConfig.promiseProvider = function promiseProvider() {
      var deferred = root.jQuery.Deferred();
      return {
        promise: deferred.promise(),
        resolve: deferred.resolve,
        reject: deferred.reject
      };
    };
  }
  else {
    PromiseWindow.defaultConfig.promiseProvider = function() {
      throw new Error('Missing promiseProvider in PromiseWindow configuration');
    };
  }

  prototype = PromiseWindow.prototype;

  /**
   * Checks whether a value is a boolean
   * @param {*} value The value to check
   * @return {boolean} `true` if value is a boolean, `false` otherwise
   * @protected
   */
  prototype._isBoolean = function _isBoolean(value) {
    return value === true || value === false;
  };

  /**
   * Converts a config value into a value compatible with `window.open`.
   * If value is a boolean, convert it to 'yes' or 'no', otherwise simply
   * casts it into a string.
   * @param {*} value The value to convert
   * @return {string} The converted value
   * @protected
   */
  prototype._serializeFeatureValue = function _serializeFeatureValue(key, value) {
    if (this._isBoolean(value)) {
      return value ? 'yes' : 'no';
    }
    return '' + value;
  };

  /**
   * Get the left and top position in the screen for a rectangle, taking
   * dual-screen position into account
   * @param {Number} width Width of the rectangle
   * @param {Number} height Height of the rectangle
   * @return {Object} position A new object representing the position of the rectangle, centered
   * @return {Number} position.left The X coordinate of the centered rectangle
   * @return {Number} position.top The Y coordinate of the centered rectangle
   * @return {Number} position.width The width of the centered rectangle
   * @return {Number} position.height The height of the centered rectangle
   * @protected
   */
  prototype._getCenteredPosition = function _getCenteredPosition(width, height) {
    var dualScreenLeft = root.screenLeft !== undefined ? root.screenLeft : screen.left,
        dualScreenTop = root.screenTop !== undefined ? root.screenTop : screen.top,
        w = root.innerWidth || html.clientWidth || screen.width,
        h = root.innerHeight || html.clientHeight || screen.height;

    return {
      left: (w / 2) - (width / 2) + dualScreenLeft,
      top:  (h / 2) - (height / 2) + dualScreenTop,
      width: width,
      height: height
    };
  };

  /**
   * Generates window features based on the current configuration
   * @return {String} Returns window features compatible with `window.open`
   * @protected
   */
  prototype._getFeatures = function _getFeatures() {
    var config = this._getCenteredPosition(this.config.width, this.config.height);
    for (var key in this.config.window) {
      if (this.config.window.hasOwnProperty(key)) {
        config[key] = this.config.window[key];
      }
    }

    return Object.keys(config)
      .map(function(key) { return key + '=' + this._serializeFeatureValue(key, config[key]); }.bind(this))
      .join(',');
  };

  /**
   * Creates a new Promise, using `config.promiseProvider`, and save reject and
   * resolve methods for later.
   *
   * @return {Promise} Returns the new Promise object created by the configured
   *                   Promise Provider.
   * @protected
   */
  prototype._createPromise = function _createPromise() {
    var module = this.config.promiseProvider();
    this._resolve = module.resolve;
    this._reject = module.reject;
    return module.promise;
  };

  /**
   * Checks whether the window is alive or not
   * @return {Boolean} Returns `true` if the window is alive, `false` otherwise
   * @protected
   */
  prototype._isWindowAlive = function _isWindowAlive() {
    return this._window && !this._window.closed;
  };

  /**
   * Starts the popup window watcher.
   * @return {void}
   * @protected
   */
  prototype._startWatcher = function _startWatcher() {
    if (this._watcherRunning) {
      throw new Error('Watcher is already started');
    }
    this._watcher = root.setInterval(function () {
      if (this._watcherRunning && !this._isWindowAlive()) {
        this.close();
      }
    }.bind(this), this.config.watcherDelay);
    this._watcherRunning = true;
  };

  /**
   * Stops the popup window watcher.
   * @return {void}
   * @protected
   */
  prototype._stopWatcher = function _stopWatcher() {
    if (!this._watcherRunning) {
      throw new Error('Watcher is already stopped');
    }
    this._watcherRunning = false;
    root.clearInterval(this._watcher);
  };

  /**
   * Callback for post message events. If and only of the event has been
   * generated from the opened popup window, it propagates it to the configured
   * post message handler (`config.onPostMessage`).
   *
   * @param {Event} event The postMessage event
   * @return {void}
   * @protected
   */
  prototype._onPostMessage = function _onPostMessage(event) {
    if (this._window === event.source) {
      this.config.onPostMessage.call(this, event);
    }
  };

  /**
   * Changes the URI
   * @param {String} uri The new URI
   * @throws {Error} If the window is open
   * @return {PromiseWindow} Returns this object to allow chaining
   */
  prototype.setURI = function setURI(uri) {
    if (this.isOpen()) {
      throw new Error('Cannot change the URI while the window is open');
    }
    this.uri = uri;
    return this;
  };

  /**
   * Opens a new popup window.
   *
   * @return {Promise} Returns a new `Promise` object. This promise will be:
   *                   - rejected with `"blocked"` message if the popup window
   *                     does not open for any reason (popup blocker, etc...)
   *                   - rejected with `"closed"` if closed either manually by
   *                     the user, or programatically
   *                   - rejected with the given error if the web page opened in
   *                     the popup sends a post message with a `error` data field.
   *                   - resolved with the given data if the web page opened in
   *                     the popup sends a post message without a `error` data
   *                     field.
   */
  prototype.open = function open() {
    if (this.isOpen()) {
      throw new Error('Window is already open');
    }
    this._windowOpen = true;
    var promise = this._createPromise();
    this._window = root.open(
      this.uri,
      this.config.windowName,
      this._getFeatures()
    );
    if (!this._window) {
      this._reject("blocked");
    }
    else {
      root.addEventListener("message", this._onPostMessage, true);
      this._startWatcher();
    }
    return promise;
  };

  /**
   * Closes the popup window.
   *
   * @return {void}
   */
  prototype.close = function close() {
    if (!this.isOpen()) {
      throw new Error('Window is already closed');
    }
    this._stopWatcher();
    root.removeEventListener("message", this._onPostMessage);
    if (this._isWindowAlive()) {
      this._window.onclose = null;
      this._window.close();
    }
    this._reject("closed");
    this._window = null;
    this._windowOpen = false;
  };

  /**
   * Checks whether the window is open or not
   * @return {Boolean} Returns `true` if the window is opened, `false` otherwise.
   */
  prototype.isOpen = function isOpen() {
    return this._windowOpen;
  };

  // Exports PromiseWindow to the global scope
  /* jshint ignore:start */
  if (typeof define === 'function' && define.amd) {
    define('promise-window', [], function() { return PromiseWindow });
  } else if (typeof exports === 'object') {
    module.exports = PromiseWindow;
  } else {
    root.PromiseWindow = PromiseWindow;
  }
  /* jshint ignore:end */

})();
