(function(root) {
  "use strict";
  root.getCustomProvider = function() {
    return root.ayepromise.defer;
  };
})(window);
