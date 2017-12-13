promise-window
==============

Lightweight wrapper around window.open() that adds Promise and postMessage support

[![Latest Stable Version](https://img.shields.io/bower/v/promise-window.svg?style=flat-square)](http://bower.io/search/?q=promise-window)
[![Latest Stable Version](https://img.shields.io/npm/v/promise-window.svg?style=flat-square)](https://www.npmjs.com/package/promise-window)
[![Build Status](https://img.shields.io/travis/amercier/promise-window/master.svg?style=flat-square)](https://travis-ci.org/amercier/promise-window)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/amercier/promise-window.svg?style=flat-square)](https://codeclimate.com/github/amercier/promise-window)
[![Test Coverage](http://img.shields.io/coveralls/amercier/promise-window/master.svg?style=flat-square)](https://coveralls.io/r/amercier/promise-window?branch=master)
[![Dependency Status](http://img.shields.io/gemnasium/amercier/promise-window.svg?style=flat-square)](https://gemnasium.com/amercier/promise-window)

[![PromiseWindow](https://cloud.githubusercontent.com/assets/1246795/6099683/cdd9e59c-afb3-11e4-92a3-f1688990984f.png)](http://amercier.github.io/promise-window/)

[Live example](http://amercier.github.io/promise-window/)


Installation
------------

### Bower (recommended) ###

    bower install promise-window --save-dev

### NPM ###

    npm install promise-window --save-dev

### Manuall installation ###

Grab a copy of [promise-window](https://raw.githubusercontent.com/amercier/promise-window/master/dist/promise-window.min.js)
([development version](https://raw.githubusercontent.com/amercier/promise-window/master/dist/promise-window.js)).


Usage
-----

The simplest way to use PromiseWindow is to use the `PromiseWindow.open`
convenience method:

```javascript
/**
 * index.html
 */
PromiseWindow.open('http://popup.html').then(

  // Success
  function(data) {
    // data.result == 'awesome' (1)
  },

  // Error
  function(error) {
    switch(error) {
      case 'closed':
        // window has been closed
        break;
      case 'my-custom-message':
        // 'my-custom-message' postMessage has been sent from target URL (2)
        break;
    }
  }
);
```

```javascript
/**
 * popup.html
 */

// report succees
opener.postMessage({ result: 'awesome' }, location.origin); // (1)

// report error
opener.postMessage({ error: 'my-custom-message' }, location.origin); // (2)
```


### Advanced usage ###

Instantiating the `PromiseWindow` prototype gives you more control. The
following example shows how to close the window after 30 seconds.

```javascript
var promiseWindow = new PromiseWindow('http://popup.html'),
    timeout = window.setTimeout(function() {
      promiseWindow.close();
    }, 30000);

promiseWindow.open().then(
  function(data) {
    window.clearTimeout(timeout);
    // ... (success)
  },
  function(error) {
    window.clearTimeout(timeout);
    // ... (error)
  }
);
```

See [API Documentation](http://amercier.github.io/promise-window/api/#!/api/PromiseWindow)
for more information about the `PromiseWindow` prototype.


Authors
-------

- [Alex Mercier](https://amercier.com/)


Versioning
----------

This library follows [Semantic Versioning](http://semver.org)


Want to help?
-------

Please do! We are always looking to improve this component. Please see our
[Contribution Guidelines](https://github.com/amercier/promise-window/blob/master/CONTRIBUTING.md)
on how to properly submit issues and pull requests.


Legal
-----

[Alex Mercier](https://amercier.com/) © 2015

[Licensed under the MIT license](http://opensource.org/licenses/MIT)
