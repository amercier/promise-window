(function($, PromiseWindow) {
  'use strict';

  $(document).ready(function() {

    var $alert = $('.alert'),
        $button = $('input[type="submit"]'),
        $url = $('input[name="url"]');

    // Send origin to sender so it can use it as `targetOrigin` in its
    // `postMessage` call.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    $url.val($url.val() + '?origin=' + encodeURI(window.origin));

    $('form[name="demo"]').submit(function(event) {
      event.preventDefault();

      // Open the window
      // ---------------

      PromiseWindow.open(this.elements.url.value, {
        width: +this.elements.width.value,
        height: +this.elements.height.value,
        window: {
          scrollbars: this.elements.scrollbars.checked
        }
      }).then(
        // Success
        function(data) {
          $alert.
            removeClass('alert-info').
            addClass('alert-success').
            text('Received message: \"' + data.message + '\"');
          $button.prop('disabled', false);
        },
        // Error
        function(reason) {
          $alert.removeClass('alert-info');
          switch(reason) {
            case 'blocked': $alert.addClass('alert-danger').text("Popup has been blocked"); break;
            case 'closed': $alert.addClass('alert-danger').text("Popup has been closed"); break;
            case 'canceled': $alert.addClass('alert-warning').text("Cancel button has been clicked"); break;
            default: $alert.addClass('alert-danger').text("Unknown reason: " + reason); break;
          }
          $button.prop('disabled', false);
        }
      );

      // Disable the button
      $button.prop('disabled', true);

      // Update the message
      $alert.
        removeClass('alert-success alert-warning alert-danger').
        addClass('alert-info').
        text('The popup window is open');
    });

    // Enable the form since we have bound all events
    $('[disabled]').prop('disabled', false);
  });

})(window.jQuery, window.PromiseWindow);
