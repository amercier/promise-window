(function($) {
  'use strict';

  $(document).ready(function() {

    // Send a success post message on submit
    $('form[name="popup"]').submit(function(event) {
      event.preventDefault();
      opener.postMessage({
        message: $('[name="message"]').val()
      }, location.origin);
    });

    // Send an error post message on cancel
    $('[name="cancel"]').on('click', function() {
      opener.postMessage({
        error: 'canceled'
      }, location.origin);
    });

    // Enable the form since we have bound all events
    $('[disabled]').prop('disabled', false);
  });

})(window.jQuery);
