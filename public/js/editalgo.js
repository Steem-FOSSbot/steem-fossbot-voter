function deleteMetric(idx) {
	window.location.href = "/edit-algo?api_key="+getApiKey(window.location.href)+"&remove="+idx;
}

function testAlgo() {
	window.location.href = "/test-algo?api_key="+getApiKey(window.location.href);
}

function selectKey(key) {
	var input = document.getElementById('inputKey');
	if (input) {
		input.value = key;
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
}

function getApiKey(url) {
	var apiKey = "";
	var parts = window.location.href.split("&");
	for (var i = 0 ; i < parts.length ; i++) {
		var idx = parts[i].search("api_key=");
		if (idx >= 0) {
			var apiKey = parts[i].substring(idx + 8, parts[i].length);
		}
	}
	return apiKey;
}