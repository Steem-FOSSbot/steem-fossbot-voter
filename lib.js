'use strict';

var exports = module.exports;

exports.fatalError = false;
exports.serverState = "stopped";


/*
* Tests
*/

/*
testEnvVars():
* Test environment variables and log results
*/
exports.testEnvVars = function () {
  if (showFatalError()) {
    return;
  }
  console.log("steem user: "+process.env.STEEM_USER);
  if (!process.env.STEEM_USER) {
    setError("init_error", true, "No STEEM_USER config var set, minimum env vars requirements not met");
  }
  console.log("private posting key?: "+(process.env.POSTING_KEY_PRV ? "true" : "false"));
  if (!process.env.POSTING_KEY_PRV) {
    setError("init_error", true, "No POSTING_KEY_PRV config var set, minimum env vars requirements not met");
  }
  console.log("api key?: "+(process.env.API_KEY ? "true" : "false"));
  if (!process.env.API_KEY) {
    setError("init_error", true, "No API_KEY config var set, minimum env vars requirements not met");
  }
  console.log("email address: "+process.env.EMAIL_ADDRESS);
}

/*
initSteem():
* Initialize steem, test API connection and get minimal required data
*/
exports.initSteem = function () {
  if (showFatalError()) {
    return;
  }
  if (process.env.STEEM_USER) {
    steem.api.getAccounts([process.env.STEEM_USER], function(err, result) {
      //console.log(err, result);
      if(err || result.length < 1) {
        setError("init_error", true, "Could not fetch STEEM_USER"+(err ? ": "+err.message : ""));
      }

    });
  }
}

/*
* Utils
*/

/*
setError(status, isFatal, message):
* Set general error for server
*/
exports.setError = function (status, isFatal, message) {
  serverState = status;
  fatalError = !fatalError && isFatal;
  console.log("setError to \""+serverState+"\" "+(isFatal ? "(FATAL) " : "")+(message ? ", "+message : ""));
}

/*
hasFatalError():
*/
exports.hasFatalError = function () {
	return fatalError;
}

/*
getServerState():
*/
exports.getServerState = function () {
	return serverState;
}

/*
showFatalError()
* Show message for fatal error check.
* return: true if fatal error
*/
exports.showFatalError = function () {
  if (fatalError) {
    console.log("cannot process initSteem function, fatal error has already occured. Please fix and restart server");
  }
  return fatalError;
}