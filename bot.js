'use strict';

const
  lib = require("./lib.js");


// start bot iteration, this node script should be run as a job
console.log("calling initSteem...");
lib.initSteem();
if (lib.hasFatalError()) {
	console.log("initSteem failed!");
	lib.sendEmail("Voter bot", "initSteem failed, please see logs");
} else {
	console.log("calling runBot...");
	lib.runBot(function(msg) {
		console.log("runBot finished with message: "+JSON.stringify(msg));
	});
}