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
  lib.testEnvVars();
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