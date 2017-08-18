
var fieldNames = [
  "MAX_VOTES_IN_24_HOURS",
  "MIN_POST_AGE_TO_CONSIDER",
  "TIME_ZONE",
  "REMOVED__EMAIL_DIGEST",
  "MAX_POST_TO_READ",
  "MIN_WORDS_FOR_ARTICLE",
  "NUM_POSTS_FOR_AVG_WINDOW",
  "MIN_SCORE_THRESHOLD",
  "SCORE_THRESHOLD_INC_PC",
  "CAPITAL_DOLPHIN_MIN",
  "CAPITAL_WHALE_MIN",
  "MIN_KEYWORD_LEN",
  "DAYS_KEEP_LOGS",
  "MIN_LANGUAGE_USAGE_PC",
  "MIN_KEYWORD_FREQ",
  "MIN_VOTING_POWER",
  "VOTE_VOTING_POWER"
];

function updateVar(index) {
  var name = fieldNames[index];
  var elementId = "input_field_" + index;
  var element = document.getElementById(elementId);
  if (element) {
    window.location.href = "/edit-config?"+name+"="+btoa(element.value);
  }
}

function setupConfigVars() {
  $.getJSON( "/get-config-vars?session_key="+getCookie("session_key"), function(data) {
    if (data && data.error) {
      if (data.payload) {
        window.location.href = "/api-error?type=" + data.payload;
      } else {
        window.location.href = "/api-error";
      }
    }
    var textArea = document.getElementById('config_vars');
    if (textArea) {
      textArea.value = JSON.stringify(data);
    }
    for (var i = 0 ; i < fieldNames.length ; i++) {
      if (data.hasOwnProperty(fieldNames[i])) {
        var elementId = "input_field_" + i;
        var element = document.getElementById(elementId);
        if (element) {
          element.value = data[fieldNames[i]];
        }
      }
    }
  });
}

window.onload = setupConfigVars;

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