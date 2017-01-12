'use strict';

const
  lib = require("./lib.js");


// start bot iteration, this node script should be run as a job
lib.initSteem();
lib.runBot();