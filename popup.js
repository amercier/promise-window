(function($) {
  'use strict';

  $(document).ready(function() {
    // Retrieve origin parameter value
    var originParameterMatches = /(\?|&)origin=([^&]*)(&|$)/.exec(location.search);
    var targetOrigin = originParameterMatches && originParameterMatches[2] || window.origin;

    // Send a success post message on submit
    $('form[name="popup"]').submit(function(event) {
      event.preventDefault();
      opener.postMessage({
        message: $('[name="message"]').val()
      }, targetOrigin); // '*' is not recommended
    });

    // Send an error post message on cancel
    $('[name="cancel"]').on('click', function() {
      opener.postMessage({
        error: 'canceled'
      }, targetOrigin); // '*' is not recommended
    });

    // Enable the form since we have bound all events
    $('[disabled]').prop('disabled', false);
  });

})(window.jQuery);
