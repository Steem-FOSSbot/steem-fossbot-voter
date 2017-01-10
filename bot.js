'use strict';

const
  lib = require("./lib.js");

/*
* Main loop
*/

/*
mainLoop():
* Process an iteration of the main loop
*/
function mainLoop() {
  console.log("mainLoop: started, state: "+lib.getServerState());
  lib.sendEmail("Voter bot", "Update: Main loop debug test");
}


// start main loop, this node script should be run as a job
mainLoop();