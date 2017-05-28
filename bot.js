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
		if (process.env.VERBOSE_LOGGING !== undefined
      && process.env.VERBOSE_LOGGING !== null
      && process.env.VERBOSE_LOGGING.toLowerCase().localeCompare("true") === 0) {
      console.log("(bot.js) runBot finished with message: "+JSON.stringify(msg));
		} else {
      console.log("(bot.js) runBot finished");
		}
		// #53, stop this process as it may stay alive indefinitely
		process.exit();
	}, {local: true});
}