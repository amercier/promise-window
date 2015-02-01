(function() {
  'use strict';

  var root = window,
      errorMessage = 'Window is already ',
      prototype,
      html = root.document.documentElement;

  // Exports PromiseWindow to the global scope
  root.PromiseWindow = PromiseWindow;

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
   */
  function generateUniqueString(prefix) {
    return prefix + new Date().getTime() + "-" + Math.floor(10e12 * Math.random());
  }

  /**
   * Create a new PromiseWindow object
   *
   * Each instance is associated with one URL. It is not encouraged to use it
   * with multiple URLs. Instead, consider instanciating new objects.
   *
   * During the lifecycle of this object, popup windows can be opened, closed,
   * and reopened again. However, it'
   *
   * Instanciating this prototype does not immediately opens a new popup window.
   * To open the window, use `open()` on the created object.
   *
   * @see #open()
   * @see #close()
   * @see PromiseWindow#open()
   *
   * @param {String}   url                    Destination URL
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
   * @param {Number}   config.watcherDelay    There is no programmatic way of knowing when a popup window is closed
   *                                          (either manually or programatically). For this reason, every time
   *                                          PromiseWindow opens a popup, a new watcher is created. The watcher checks
   *                                          regularly if the window is still open. This value defines at which
   *                                          interval this check is done. Defaults to 100ms.
   * @param {String}   config.windowName      Name to be ginven to the popup window. See `window.open` references for
   *                                          details. If `null`, a random name is generated.
   * @constructor
   */
  function PromiseWindow(url, config) {
    this.url = url;
    this.config = extend({}, config, this.constructor.defaultConfig);
    this.config.windowName = this.config.windowName || generateUniqueString('promise-window-');
    this._onPostMessage = this._onPostMessage.bind(this);
  };

  /**
   * Create a Promise provider from a Promise/A+ constructor to be used with
   * `config.promiseProvider`.
   *
   *     new PromiseWindow(..., {
   *       ...,
   *       promiseProvider: PromiseWindow.getAPlusPromiseProvider(MyCustomPromise)
   *     });
   *
   * @param  {[type]} constructor Promise/A+ contructor
   * @return {Function} Returns a promise provider
   */
  PromiseWindow.getAPlusPromiseProvider = function getAPlusPromiseProvider(constructor) {
    return function promiseProvider() {
      var module = {};
      module.promise = new constructor(function(resolve, reject) {
        module.resolve = resolve;
        module.reject = reject;
      });
      return module;
    }
  };

  /**
   * Convenience method for:
   *
   *     new PromiseWindow(url, config).open()
   *
   * Use this method only if you never need to close the window programatically.
   * If you do, please consider using the classic way:
   *
   *     var w = new PromiseWindow(url, config)
   *     w.open();
   *     // ...
   *     w.close();
   *
   * @see PromiseWindow
   * @return {Promise} Returns a Promise equivalent to the one returned by `open()`
   */
  PromiseWindow.open = function open(url, config) {
    return new PromiseWindow(url, config).open();
  };

  /**
   * Default configuration
   * @type {Object}
   */
  PromiseWindow.defaultConfig = {
    width: html.clientWidth,
    height: html.clientHeight,
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

  prototype = PromiseWindow.prototype;

  /**
   * Generates window features based on the current configuration
   * @return {String} Returns window features compatible with `window.open`
   */
  prototype._getFeatures = function _getFeatures() {
    var width = this.config.width,
        height = this.config.height;

    // Center popup, taking dual-screen position into account
    var dualScreenLeft = root.screenLeft !== undefined ? root.screenLeft : screen.left,
        dualScreenTop = root.screenTop !== undefined ? root.screenTop : screen.top,
        w = root.innerWidth || html.clientWidth || screen.width,
        h = root.innerHeight || html.clientHeight || screen.height,
        left = (w / 2) - (width / 2) + dualScreenLeft,
        top =  (h / 2) - (height / 2) + dualScreenTop;

    return "scrollbars=yes, width=" + width + ", height=" + height +
      ", top=" + top + ", left=" + left;
  };

  /**
   * Create a new Promise, using `config.promiseProvider`, and save reject and
   * resolve methods for later.
   *
   * @return {Promise} Returns the new Promise object created by the configured
   *                   Promise Provider.
   */
  prototype._createPromise = function() {
    var module = this.config.promiseProvider();
    this._resolve = module.resolve;
    this._reject = module.reject;
    return module.promise;
  };

  /**
   * Checks whether the window is alive or not
   * @return {Boolean} Returns `true` if the window is alive, `false` otherwise
   */
  prototype._isWindowAlive = function _hasWindowDied() {
    return this._window && !!this._window.document;
  };

  /**
   * Starts the popup window watcher.
   * @return {void}
   */
  prototype._startWatcher = function _startWatcher() {
    if (this._watcherRunning) {
      throw new Error(errorMessage + 'running');
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
   */
  prototype._stopWatcher = function _stopWatcher() {
    if (!this._watcherRunning) {
      throw new Error(errorMessage + 'stopped');
    }
    this._watcherRunning = false;
    root.clearInterval(this._watcher);
  };

  /**
   * Callback for post message events. If and only of the event has been
   * generated from the opened popup window, it propagates it to the configured
   * post message handler (`config.onPostMessage`).
   *
   * @return {void}
   */
  prototype._onPostMessage = function(event) {
    if (this._window === event.source) {
      this.config.onPostMessage.apply(this, [event]);
    }
  };

  /**
   * Open a new popup window.
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
      throw new Error(errorMessage + 'open');
    }
    this._windowOpen = true;
    var promise = this._createPromise();
    this._window = root.open(
      this.url,
      this.config.windowName,
      this._getFeatures()
    );
    if (!this._window) {
      this._reject("blocked");
    }
    else {
      this._startWatcher();
      root.addEventListener("message", this._onPostMessage, true);
    }
    return promise;
  };

  /**
   * Close the popup window.
   *
   * @return {void}
   */
  prototype.close = function close() {
    if (!this.isOpen()) {
      throw new Error(errorMessage + 'closed');
    }
    this._stopWatcher();
    root.removeEventListener("message", this._onPostMessage);
    if (this._isWindowAlive()) {
      this._window.close();
    }
    this._reject("closed");
    this._window = null;
    this._windowOpen = false;
  };

  /**
   * Check whether the window is open or not
   * @return {Boolean} Returns `true` if the window is opened, `false` otherwise.
   */
  prototype.isOpen = function isOpen() {
    return this._windowOpen;
  };

})();
