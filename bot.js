'use strict';

const
  lib = require("./lib.js");


// start bot iteration, this node script should be run as a job
console.log("calling initSteem...");
lib.initSteem(function() {
  if (lib.hasFatalError()) {
    console.log("initSteem failed!");
    lib.sendEmail("Voter bot", "initSteem failed, please see logs");
  } else {
    console.log("calling runBot 1...");
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
    // modify call to include environment parameters
    //}, {local: true});
    }, 
    {local: true,
     steemUser:process.env.STEEM_USER,
     postingKeyPrv:process.env.POSTING_KEY_PRV,
     botApiKey:process.env.BOT_API_KEY
     });

      console.log("calling runBot 2...");
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
    // modify call to include environment parameters
    //}, {local: true});
    }, 
    {local: true,
     steemUser:process.env.STEEM_USER,
     postingKeyPrv:process.env.POSTING_KEY_PRV,
     botApiKey:process.env.BOT_API_KEY
     });

      console.log("calling runBot 3...");
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
    // modify call to include environment parameters
    //}, {local: true});
    }, 
    {local: true,
     steemUser:process.env.STEEM_USER,
     postingKeyPrv:process.env.POSTING_KEY_PRV,
     botApiKey:process.env.BOT_API_KEY
     });
}
});
