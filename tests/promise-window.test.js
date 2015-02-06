(function(QUnit) {
  'use strict';

  function getConfig() {
    return !window.getCustomProvider ? {} : {
      promiseProvider: window.getCustomProvider()
    };
  }

  function getRelativeURI(relativeURI) {
    var base = document.querySelector("base");
    return base ? relativeURI.replace(/^\./, base.href) : relativeURI;
  }

  QUnit.module('config');

  QUnit.test('onPostMessage is called', function(assert) {
    assert.expect(1);

    var config = getConfig(),
        promiseWindow,
        done = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          done();
        }, 2000),
        called = false;

    config.onPostMessage = function(data) {
      called = true;
      return PromiseWindow.defaultConfig.onPostMessage.call(this, data);
    };
    promiseWindow = new PromiseWindow(getRelativeURI('./stubs/post-message-success.html'), config);

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(called, 'onPostMessage has been called');
        done();
      },
      function() {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be rejected');
        done();
      }
    );
  });

  QUnit.module('open()');

  QUnit.test('Rejects promise when blocked', function(assert) {
    assert.expect(2);

    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/empty.html'), getConfig()),
        done = assert.async(),
        _open = window.open,
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          _done();
        }, 2000);

    function _done() {
      window.open = _open;
      done();
    }

    window.open = function blocked() {
      return null;
    };

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be resolved');
        _done();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise has been rejected');
        assert.strictEqual(error, 'blocked', 'Promise is rejected with "blocked" reason');
        _done();
      }
    );
  });

  QUnit.test('Rejects promise when user closes the window', function(assert) {
    assert.expect(2);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/empty.html'), getConfig()),
        done = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          done();
        }, 2000);

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be resolved');
        done();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise has been rejected');
        assert.strictEqual(error, 'closed', 'Promise is rejected with "closed" reason');
        done();
      }
    );

    setTimeout(function() {
      promiseWindow._window.close();
    }, 0);
  });

  QUnit.test('Resolves Promise when receiving a success postMessage', function(assert) {
    assert.expect(5);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/post-message-success.html'), getConfig()),
        done1 = assert.async(),
        done2 = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          promiseWindow._window.close();
          done1();
        }, 2000);

    promiseWindow.open().then(
      function(data) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise should be resolved');
        assert.notEqual(data, undefined, 'Resolve data is passed to the callback');
        assert.deepEqual(data, { result: 'OK' }, 'Resolve data contains the post message data');
        done1();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be rejected (' + error + ')');
        done1();
      }
    );

    assert.throws(
      function() { promiseWindow.open(); },
      'Error: Window is already open',
      'open() should throw an Error whan called twice'
    );

    assert.throws(
      function() { promiseWindow._startWatcher(); },
      'Error: Watcher is already started',
      '_startWatcher() should throw an Error whan called after window is opened'
    );

    done2();

  });

  QUnit.test('Resolves Promise when receiving a success postMessage after a redirection', function(assert) {
    assert.expect(5);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/redirect-success.html'), getConfig()),
        done1 = assert.async(),
        done2 = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          promiseWindow._window.close();
          done1();
        }, 2000);

    promiseWindow.open().then(
      function(data) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise should be resolved');
        assert.notEqual(data, undefined, 'Resolve data is passed to the callback');
        assert.deepEqual(data, { result: 'OK' }, 'Resolve data contains the post message data');
        done1();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be rejected (' + error + ')');
        done1();
      }
    );

    assert.throws(
      function() { promiseWindow.open(); },
      'Error: Window is already open',
      'open() should throw an Error whan called twice'
    );

    assert.throws(
      function() { promiseWindow._startWatcher(); },
      'Error: Watcher is already started',
      '_startWatcher() should throw an Error whan called after window is opened'
    );

    done2();

  });

  QUnit.test('Rejects Promise when receiving a error postMessage', function(assert) {
    assert.expect(2);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/post-message-error.html'), getConfig()),
        done = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          promiseWindow._window.close();
          done();
        }, 2000);

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be resolved');
        done();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise should be resolved');
        assert.strictEqual(error, "NOK", 'Reject error is passed to the callback');
        done();
      }
    );
  });


  QUnit.module('close()');

  QUnit.test('Rejects promise', function(assert) {
    assert.expect(4);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/empty.html'), getConfig()),
        done1 = assert.async(),
        done2 = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          promiseWindow._window.close();
          done1();
        }, 2000);

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be resolved');
        done1();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(true, 'Promise has been rejected');
        assert.strictEqual(error, 'closed', 'Promise has been rejected with "closed" reason');
        done1();
      }
    );


    setTimeout(function() {
      promiseWindow.close();

      assert.throws(
        function() { promiseWindow.close(); },
        'Error: Window is already closed',
        'close() should throw an Error whan called twice'
      );

      assert.throws(
        function() { promiseWindow._stopWatcher(); },
        'Error: Watcher is already stopped',
        '_stopWatcher() should throw an Error whan called after window is closed'
      );

      done2();
    }, 0);
  });


  QUnit.module('setURI()');

  QUnit.test('Rejects Promise when receiving a error postMessage', function(assert) {
    assert.expect(1);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/post-message-error.html'), getConfig()),
        done = assert.async(),
        timeout = setTimeout(function() {
          assert.ok(false, 'Promise should not be pending before 2000ms');
          promiseWindow._window.close();
          done();
        }, 2000);

    promiseWindow.setURI(getRelativeURI('./stubs/post-message-success.html'));

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        assert.ok(true, 'Promise should be resolved');
        done();
      },
      function(error) {
        clearTimeout(timeout);
        assert.ok(false, 'Promise should not be rejected (' + error + ')');
        done();
      }
    );
  });

  QUnit.test('Throws an error when called while the window is open', function(assert) {
    assert.expect(1);
    var promiseWindow = new PromiseWindow(getRelativeURI('./stubs/empty.html'), getConfig()),
        done = assert.async(),
        timeout = setTimeout(function() {
          done();
        }, 2000);

    promiseWindow.open().then(
      function() {
        clearTimeout(timeout);
        done();
      },
      function() {
        clearTimeout(timeout);
        done();
      }
    );

    assert.throws(
      function() { promiseWindow.setURI('/this-should-fail.html'); },
      new Error('Cannot change the URI while the window is open'),
      'Should throw an error when called while the window is open'
    );

    setTimeout(function() {
      promiseWindow._window.close();
    }, 0);
  });


  QUnit.module('PromiseWindow.open()');

  QUnit.test('Resolves Promise when receiving a success postMessage', function(assert) {
    assert.expect(3);
    var done = assert.async();

    PromiseWindow.open(getRelativeURI('./stubs/post-message-success.html'), getConfig()).then(
      function(data) {
        assert.ok(true, 'Promise should be resolved');
        assert.notEqual(data, undefined, 'Resolve data is passed to the callback');
        assert.deepEqual(data, { result: 'OK' }, 'Resolve data contains the post message data');
        done();
      },
      function(error) {
        assert.ok(false, 'Promise should not be rejected (' + error + ')');
        done();
      }
    );
  });

})(window.QUnit);
