(function(root) {
  "use strict";
  root.getCustomProvider = function() {
    return root.PromiseWindow.getAPlusPromiseProvider(root.vow.Promise);
  };
})(window);
