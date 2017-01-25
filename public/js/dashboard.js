$(document).ready(function () {
  $('[data-toggle="offcanvas"]').click(function () {
    $('.row-offcanvas').toggleClass('active')
  });
});

function gotoPage(page) {
	var inputApiKeyElement = document.getElementById('input_api_key');
  var apiKey = "";
	if (inputApiKeyElement) {
		apiKey = "?api_key=" + inputApiKeyElement.value;
  }
	if (page == 0) {
		window.location.href = "/run-bot"+apiKey;
	} else if (page == 1) {
		window.location.href = "/stats"+apiKey;
	} else if (page == 2) {
		window.location.href = "/edit-algo"+apiKey;
	} else if (page == 3) {
		window.location.href = "/test-algo"+apiKey;
	} else if (page == 4) {
		window.location.href = "/last-log"+apiKey;
	}
}