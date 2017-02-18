function deleteMetric(key) {
	window.location.href = "/edit-algo?delete="+key;
}

function selectKey(key, weight, lower, upper) {
	var input = document.getElementById('inputKey');
  var inputWeight = document.getElementById('inputWeight');
  var inputLower = document.getElementById('inputLower');
  var inputUpper = document.getElementById('inputUpper');
  console.log("selectKey: key="+key+", weight="+weight+", lower="+lower+", upper="+upper);
  // set values
  input.value = key; //required
	if (weight) {
		inputWeight.value = "" + weight;
	} else {
    inputWeight.value = "";
  }
  if (lower) {
		inputLower.value = getFixedDecimalPlacesIfNone(lower);
  } else {
    inputLower.value = "";
	}
  if (upper) {
    inputUpper.value = getFixedDecimalPlacesIfNone(upper);
  } else {
    inputUpper.value = "";
	}
  console.log("selectKey: values now are lower="+inputLower.value+", upper="+inputUpper.value);
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function getFixedDecimalPlacesIfNone(num) {
  // check if Math.trunc exists, not available on most mobile browsers for example currently
  if (!Math.trunc) {
    return num;
  }
  if (Math.abs(num - Math.trunc(num)) > 0) {
    return num;
  }
  return "" + num + ".00"
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