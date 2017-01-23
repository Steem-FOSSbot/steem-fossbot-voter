function deleteMetric(key) {
	window.location.href = "/edit-algo?delete="+key;
}

function selectKey(key, weight, lower, upper) {
	var input = document.getElementById('inputKey');
	if (input) {
		input.value = key;
	}
	if (weight) {
    var inputWeight = document.getElementById('inputWeight');
    if (inputWeight) {
      inputWeight.value = weight;
    }
	}
  if (lower) {
    var inputLower = document.getElementById('inputLower');
    if (inputLower) {
      inputLower.value = lower;
    }
  }
  if (upper) {
    var inputUpper = document.getElementById('inputUpper');
    if (inputUpper) {
      inputWeight.value = upper;
    }
  }
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function exportAlgo() {
	$.getJSON( "/get-algo?session_key="+getCookie("session_key"), function(data) {
		var textArea = document.getElementById('json_algo');
		if (textArea) {
			textArea.value = data;
		}
	});
}

function getCookie(cname) {
  console.log("getCookie: all cookies: "+document.cookie);
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
  }
  return "";
}