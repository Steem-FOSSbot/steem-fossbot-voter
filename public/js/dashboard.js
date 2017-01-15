$(document).ready(function () {
  $('[data-toggle="offcanvas"]').click(function () {
    $('.row-offcanvas').toggleClass('active')
  });
});

function gotoPage(page) {
	var apiKey = document.getElementById('input_api_key').value;
	if (page == 0) {
		window.location.href = "/run-bot?api_key="+apiKey;
	} else if (page == 1) {
		window.location.href = "/stats?api_key="+apiKey;
	} else if (page == 2) {
		window.location.href = "/edit-algo?api_key="+apiKey;
	} else if (page == 3) {
		window.location.href = "/test-algo?api_key="+apiKey;
	}
}