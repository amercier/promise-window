(function(QUnit) {
  'use strict';

  function getRelativeURL(relativeURL) {
    var base = document.querySelector("base");
    return base ? relativeURL.replace(/^\./, base.href) : relativeURL;
  }

  QUnit.module('open()');

  QUnit.test('Rejects promise when blocked', function(assert) {
    assert.expect(2);

    var promiseWindow = new PromiseWindow(getRelativeURL('./stubs/empty.html')),
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
    var promiseWindow = new PromiseWindow(getRelativeURL('./stubs/empty.html')),
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
    var promiseWindow = new PromiseWindow(getRelativeURL('./stubs/post-message-success.html')),
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
    var promiseWindow = new PromiseWindow(getRelativeURL('./stubs/post-message-error.html')),
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
    var promiseWindow = new PromiseWindow(getRelativeURL('./stubs/empty.html')),
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


  QUnit.module('PromiseWindow.open()');

  QUnit.test('Resolves Promise when receiving a success postMessage', function(assert) {
    assert.expect(3);
    var done = assert.async();

    PromiseWindow.open(getRelativeURL('./stubs/post-message-success.html')).then(
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
