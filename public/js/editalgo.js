function deleteMetric(key) {
	window.location.href = "/edit-algo?delete="+key;
}

function selectKey(key, weight, lower, upper) {
	var input = document.getElementById('inputKey');
  var inputWeight = document.getElementById('inputWeight');
  var inputLower = document.getElementById('inputLower');
  var inputUpper = document.getElementById('inputUpper');
  // set values
  input.value = key; //required
	if (weight !== undefined) {
		inputWeight.value = "" + weight;
	} else {
    inputWeight.value = "";
  }
  if (lower !== undefined) {
		inputLower.value = "" + lower;
  } else {
    inputLower.value = "";
	}
  if (upper !== undefined) {
    inputUpper.value = "" + upper;
  } else {
    inputUpper.value = "";
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

function getComment() {
  $.getJSON( "/get-comment?session_key="+getCookie("session_key"), function(data) {
		var textArea = document.getElementById('comment_block');
		if (textArea !== undefined &&
        data !== undefined && data.comment !== undefined) {
			textArea.value = data.comment;
		}
	});
}

window.onload = getComment;

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
