'use strict';

const
  lib = require("./lib.js"),
  express = require("express"),
  path = require("path"),
  bodyParser = require("body-parser");

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  lib.initSteem();
  if (!lib.hasFatalError()) {
    console.log("Dashboard min requirements met, will be active on HTTPS");
    lib.sendEmail("Voter bot", "Server status: started");
  } else {
    // kill node server to stop dashboard from showing and let owner know there is a problem without
    // giving any information away
    process.exit();
  }
});

module.exports = app;

// Utils
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason + ", MESSAGE: "+message);
  res.status(code || 500).json({"error": message});
}

// public HTTPS interface

/*
 * /run-bot endpoint
 *
 * Starts an iteration of the bot mainLoop
 *
 * Example usage:
 * /run-bot?API_KEY=1234
 */
app.get("/run-bot", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key invalid", 401);
    return;
  }
  lib.runBot(function(msg) {
    console.log("lib.runBot message: " + msg);
    if (msg && msg.localeCompare("ok") == 0) {
      res.status(200).json(
        {
          "result": "success",
          "message": "GET /run-bot has started bot iteration"
        }
      );
    } else {
      handleError(res, "/run-bot Internal error", "Run bot: Bot run failed internally, consult logs", 500);
    }
  });
});