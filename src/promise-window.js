(function() {
  'use strict';

  var root = window,
      errorMessage = 'Window is already ',
      prototype,
      html = root.document.documentElement;

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

  function PromiseWindow(url, config) {
    this.url = url;
    this._config = extend({}, config, this.constructor.defaultConfig);
    this._window = null;
    this._windowOpen = false;
    this._watcher = null;
    this._watcherRunning = null;
    this._onPostMessage = this._onPostMessage.bind(this);
  };

  PromiseWindow.open = function open(url, config) {
    return new PromiseWindow(url, config).open();
  };

  PromiseWindow.defaultConfig = {
    width: html.clientWidth,
    height: html.clientHeight,
    watcherDelay: 100,
    windowName: 'promise-window',
    promiseProvider: function promiseProvider() {
      var module = {};
      module.promise = new Promise(function(resolve, reject) {
        module.resolve = resolve;
        module.reject = reject;
      })
      return module;
    },
    onPostMessage: function onPostMessage(event) {
      if (event.data.error) {
        this._reject(event.data.error);
      } else {
        this._resolve(event.data);
      }
    }
  };

  prototype = PromiseWindow.prototype;

  prototype._getWindowFeatures = function _getWindowFeatures() {
    var width = this._config.width,
        height = this._config.height;

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

  prototype._createPromise = function() {
    var module = this._config.promiseProvider();
    this._resolve = module.resolve;
    this._reject = module.reject;
    return module.promise;
  };

  prototype._isWindowAlive = function _hasWindowDied() {
    return this._window && this._window.document;
  };

  prototype._startWatcher = function _startWatcher() {
    if (this._watcherRunning) {
      throw new Error(errorMessage + 'running');
    }
    this._watcher = root.setInterval(function () {
      if (this._watcherRunning && !this._isWindowAlive()) {
        this.close();
      }
    }.bind(this), this._config.watcherDelay);
    this._watcherRunning = true;
  };

  prototype._stopWatcher = function _stopWatcher() {
    if (!this._watcherRunning) {
      throw new Error(errorMessage + 'stopped');
    }
    this._watcherRunning = false;
    root.clearInterval(this._watcher);
  };

  prototype._onPostMessage = function(event) {
    if (this._window === event.source) {
      if (!this._config.onPostMessage.apply(this, [event])) {
        this.close();
      }
    }
  };

  prototype.open = function open() {
    if (this.isOpen()) {
      throw new Error(errorMessage + 'open');
    }
    this._windowOpen = true;
    this._window = root.open(
      this.url,
      this._config.windowName,
      this._getWindowFeatures()
    );
    this._startWatcher();
    root.addEventListener("message", this._onPostMessage, true);
    return this._createPromise();
  };

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

  prototype.isOpen = function isOpen() {
    return this._windowOpen;
  };

})();
