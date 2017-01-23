function deleteMetric(key) {
	window.location.href = "/edit-algo?api_key="+getApiKey(window.location.href)+"&delete="+key;
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

function exportAlgo() {
	$.getJSON( "/get-algo?api_key="+getApiKey(window.location.href), function(data) {
		var textArea = document.getElementById('json_algo');
		if (textArea) {
			textArea.value = data;
		}
	});
}

window.onload = function() {
  var apiKey = getApiKey(window.location.href);
  var hiddenInput1 = document.getElementById('metrics_api_key');
  if (hiddenInput1) {
  	hiddenInput1.value = apiKey;
  }
  var hiddenInput2 = document.getElementById('import_export_api_key');
  if (hiddenInput2) {
  	hiddenInput2.value = apiKey;
  }
};

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