'use strict';

const
  lib = require("./lib.js");


// start bot iteration, this node script should be run as a job
console.log("calling initSteem...");
lib.initSteem(function() {
  if (lib.hasFatalError()) {
    console.log("initSteem failed!");
    process.exit();
  } else {
    console.log("calling runBot...");
    lib.runBot(function(result) {
      if (result !== undefined && result !== null) {
        console.log("(bot.js) runBot finished successfully");
      } else {
        console.log("(bot.js) runBot finished with failure");
      }
      // #53, stop this process as it may stay alive indefinitely
      process.exit();
    });
  }
});