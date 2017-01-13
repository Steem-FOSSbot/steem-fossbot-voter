'use strict';

const
	steem = require("steem"),
  Q = require("q"),
  redis = require("redis"),
  redisClient = require('redis').createClient(process.env.REDIS_URL),
  glossary = require("glossary")({minFreq: 2, collapse: true}),
  S = require('string'),
  strip = require('strip-markdown'),
  remark = require('remark'),
  stripMarkdownProcessor = remark().use(strip);

const
  MINNOW = 0,
  DOLPHIN = 1,
  WHALE = 2;

const
  MAX_POST_TO_READ = 100,
  CAPITAL_DOLPHIN_MIN = 25000,
  CAPITAL_WHALE_MIN = 100000,
  MIN_KEYWORD_LEN = 3;

/* Private variables */
var fatalError = false;
var serverState = "stopped";

var steemGlobalProperties = {};

// algorithm
// - lists
var contentWordWhitelist = [];
var contentWordBlacklist = [];
var authorWhitelist = [];
var authorBlacklist = [];
var domainWhitelist = [];
var domainBlacklist = [];
// - main
var weights = [];

// data
var posts = [];
var postsNlp = [];
var lastPost = null;
var users = [];
var following = [];
// metrics
var owner = {};
var postsMetrics = [];


/*
* Bot logic
*/

/*
runBot(messageCallback):
* Process a bot iteration
*/
function runBot(messageCallback) {
  console.log("mainLoop: started, state: "+serverState);
  // first, check bot can run
  if (fatalError) {
    if (messageCallback) {
      messageCallback("failed");
    }
    sendEmail("Voter bot", "Update: runBot could not run: [fatalError with state: "+serverState+"]");
    return;
  }
  if (messageCallback) {
    messageCallback("ok");
  }
  // begin bot logic, use promises with Q
  // some general vars
  var timeNow = new Date();
  // define steps processes
  var processes = [
    // get posts
    function () {
      console.log("Q.deffered: get posts");
      var deferred = Q.defer();
      steem.api.getDiscussionsByCreated({limit: MAX_POST_TO_READ}, function(err, result) {
        //console.log(err, result);
        if (err) {
          throw {message: "Error reading posts from steem: "+err.message};
        }
        posts = result;
        console.log(" - num fetched posts: "+posts.length);
        deferred.resolve(true);
        // TODO : save posts
      });
      return deferred.promise;
    },
    // clean posts and update last fetched post
    function () {
      console.log("Q.deferred: clean posts");
      var deferred = Q.defer();
      // clean, only keep new posts since last post
      if (lastPost != null) {
        var cleanedPosts = [];
        for (var i = 0 ; i < posts.length ; i++) {
          if (posts[i].id == lastPost.id) {
            break;
          }
          cleanedPosts.push(posts[i]);
        }
        posts = cleanedPosts;
      }
      // throw nice error if no posts left
      if (posts.length < 1) {
        throw {message: "No new posts"};
      }
      // update last fetched post
      lastPost = posts[0];
      persistJson("lastpost", lastPost);
      // finish
      console.log(" - num new posts: "+posts.length);
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 1, get owner metrics 
    function () {
      console.log("Q.deferred: transform post data to metrics 1, get owner metrics ");
      var deferred = Q.defer();
      // get this user's votes
      console.log(" - count this user's votes today");
      steem.api.getAccountVotes(process.env.STEEM_USER, function(err, votes) {
        //console.log(err, votes);
        var num_votes_today = 0;
        if (err) {
          console.log(" - error, can't get "+process.env.STEEM_USER+" votes: "+err.message);
        } else {
          for (var i = 0 ; i < votes.length ; i++) {
            if ((timeNow - getEpochMillis(votes[i].time)) < (1000 * 60 * 60 * 24)) {
              num_votes_today++;
            }
          }
        }
        // finish
        owner.num_votes_today = num_votes_today;
        console.log(" - num_votes_today: "+num_votes_today);
        deferred.resolve(num_votes_today > 0);
      });
      return deferred.promise;
    },
    // transform post data to metrics 2, basic post metrics
    function () {
      console.log("Q.deferred: transform post data to metrics 2, basic post metrics");
      var deferred = Q.defer();
      // create metrics for posts
      //console.log(" - ");
      postsMetrics = [];
      var fetchUsers = [];
      for (var i = 0 ; i < posts.length ; i++) {
        console.log(" - post ["+posts[i].permlink+"]");
        var metric = {};
        // post_alive_time: Time since post, in minutes
        var postTimeStamp = getEpochMillis(posts[i].created);
        var alive_time = 0;
        if (postTimeStamp != 0) {
          alive_time = (timeNow - postTimeStamp) / (1000 * 60);
        }
        metric.post_alive_time = alive_time;
        console.log(" - - metrics.post.alive_time: "+metric.post_alive_time);
        //post_est_payout: Estimated payout
        metric.post_est_payout = parseFloat(posts[i].total_pending_payout_value);
        console.log(" - - metrics.post.est_payout: "+metric.post_est_payout);
        //post_num_votes: Number of votes
        metric.post_num_votes = posts[i].net_votes;
        console.log(" - - metrics.post.num_votes: "+metric.post_num_votes);
        // add author and voters to user fetch list
        fetchUsers.push(posts[i].author);
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          //console.log(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].active_votes[j].voter;
          // make sure this voter isn't the owner user
          if (voter.localeCompare(process.env.STEEM_USER) != 0) {
            if (!users[voter]) {
              fetchUsers.push(voter);
            }
          }
        }
        // finish first phase of metric
        postsMetrics.push(metric);
      }
      // get relevant users account details, used in next step
      if (fetchUsers.length > 0) {
        // get user info
        steem.api.getAccounts(fetchUsers, function(err, userAccounts) {
          if (err) {
            console.log(" - error, can't get "+voter+" votes: "+err.message);
          } else {
            for (var k = 0 ; k < userAccounts.length ; k++) { 
              users[userAccounts[k].name] = userAccounts[k];
            }
          }
          // finish
          console.log(" - - finished getting voters for post");
          deferred.resolve(true);
        });
      } else {
        // finish
        console.log(" - - no voters account information to get for post");
        deferred.resolve(true);
      }
      // return promise
      return deferred.promise;
    },
    // transform post data to metrics 3, analyse votes
    function () {
      console.log("Q.deferred: transform post data to metrics 3, analyse votes");
      var deferred = Q.defer();
      // analyse votes for posts
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        console.log(" - postsMetrics ["+i+"]");
        // *** VOTES IN DETAIL
        // note, should do this last, has complex nesting that we need to use Q to sort out
        //console.log(" - - * VOTES IN DETAIL");
        var numDolphins = 0;
        var numWhales = 0;
        var numFollowed = 0;
        var numWhitelisted = 0;
        var numBlacklisted = 0;
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          //console.log(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].active_votes[j].voter;
          if (voter.localeCompare(process.env.STEEM_USER) != 0
              && users[voter]) {
            var voterAccount = users[voter];
            // determine if dolphin or whale, count
            var steemPower = getSteemPowerFromVest(voterAccount.vesting_shares);
            if (steemPower >= CAPITAL_WHALE_MIN) {
              numWhales++;
            } else if (steemPower >= CAPITAL_DOLPHIN_MIN) {
              numDolphins++;
            }
            // determine if followed, count
            for (var k = 0 ; k < following.length ; k++) {
              if (following[k] && following[k].localeCompare(voter) == 0) {
                numFollowed++;
              }
            }
            // determine if white / blacklisted, count
            for (var k = 0 ; k < authorWhitelist.length ; k++) {
              if (authorWhitelist[k] && authorWhitelist[k].localeCompare(voter) == 0) {
                numWhitelisted++;
              }
            }
            for (var k = 0 ; k < authorBlacklist.length ; k++) {
              if (authorBlacklist[k] && authorBlacklist[k].localeCompare(voter) == 0) {
                numBlacklisted++;
              }
            }
          }
        }
        // numeric
        postsMetrics[i].post_voted_num_dolphin = numDolphins;
        postsMetrics[i].post_voted_num_whale = numWhales;
        postsMetrics[i].post_voted_num_followed = numFollowed;
        postsMetrics[i].post_voted_num_whitelisted = numWhitelisted;
        postsMetrics[i].post_voted_num_blacklisted = numBlacklisted;
        // boolean
        postsMetrics[i].post_voted_any_dolphin = (numDolphins > 0) ? 1 : 0;
        postsMetrics[i].post_voted_any_whale = (numWhales > 0) ? 1 : 0;
        postsMetrics[i].post_voted_any_followed = (numFollowed > 0) ? 1 : 0;
        postsMetrics[i].post_voted_any_whitelisted = (numWhitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_voted_any_blacklisted = (numBlacklisted > 0) ? 1 : 0;
      }
      // finish
      console.log(" - postsMetrics array: "+JSON.stringify(postsMetrics));
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 4, post author metrics
    function () {
      console.log("Q.deferred: transform post data to metrics 4, post author metrics");
      var deferred = Q.defer();
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        console.log(" - postsMetrics ["+i+"]");
        // check we have author account, we should
        if (users[posts[i].author]) {
          // get capital value
          var steemPower = getSteemPowerFromVest(users[posts[i].author].vesting_shares);
          //metrics.author.capital_val: Capital (Steem Power) by value 
          postsMetrics[i].author_capital_val = steemPower; 
          if (steemPower >= CAPITAL_WHALE_MIN) {
            postsMetrics[i].author_is_minnow = 0;
            postsMetrics[i].author_is_dolphin = 0;
            postsMetrics[i].author_is_whale = 1;
          } else if (steemPower >= CAPITAL_DOLPHIN_MIN) {
            postsMetrics[i].author_is_minnow = 0;
            postsMetrics[i].author_is_dolphin = 1;
            postsMetrics[i].author_is_whale = 0;
          } else {
            postsMetrics[i].author_is_minnow = 1;
            postsMetrics[i].author_is_dolphin = 0;
            postsMetrics[i].author_is_whale = 0;
          }
          // determine if followed, count
          postsMetrics[i].author_is_followed = 0;
          for (var k = 0 ; k < following.length ; k++) {
            if (following[k] && following[k].localeCompare(posts[i].author) == 0) {
              postsMetrics[i].author_is_followed = 1;
              break;
            }
          }
          // determine if white / blacklisted, count
          postsMetrics[i].author_is_whitelisted = 0;
          for (var k = 0 ; k < authorWhitelist.length ; k++) {
            if (authorWhitelist[k] && authorWhitelist[k].localeCompare(posts[i].author) == 0) {
              postsMetrics[i].author_is_whitelisted = 1;
              break;
            }
          }
          postsMetrics[i].author_is_blacklisted = 0;
          for (var k = 0 ; k < authorBlacklist.length ; k++) {
            if (authorBlacklist[k] && authorBlacklist[k].localeCompare(posts[i].author) == 0) {
              postsMetrics[i].author_is_blacklisted = 1;
              break;
            }
          }
        }
      }
      // finish
      console.log(" - postsMetrics array: "+JSON.stringify(postsMetrics));
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 5, cultural metrics, content - text
    function () {
      console.log("Q.deferred: transform post data to metrics 5, cultural metrics prestep, get NLP data");
      var deferred = Q.defer();
      postsNlp = [];
      for (var i = 0 ; i < posts.length ; i++) {
        console.log(" - post ["+posts[i].permlink+"]");
        var nlp = {};
        // sanitize body content, make plaintext, remove HTML tags and non-latin characters
        nlp.content = S(posts[i].body)
          .decodeHTMLEntities()
          .unescapeHTML()
          .stripTags()
          .latinise()
          .s;
        // remove markdown formatting
        nlp.content = new String(stripMarkdownProcessor.process(nlp.content));
        console.log(" - - nlp.content: "+nlp.content);
        // get keywords from alphanumberic only
        var keywords = glossary.extract(nlp.content.replace("([^a-zA-Z0-9])+",""));
        // remove keywords less than MIN_KEYWORD_LEN letters long
        nlp.keywords = [];
        var removedCount = 0;
        for (var j = 0 ; j < keywords.length ; j++) {
          if (keywords[j].length >= MIN_KEYWORD_LEN) {
            nlp.keywords.push(keywords[j]);
          } else {
            removedCount++;
          }
        }
        console.log(" - - nlp.keywords: "+nlp.keywords);
        console.log(" - - - removed "+removedCount+" short keywords");
        // commit to postsNlp
        postsNlp.push(nlp);
        console.log(" - - nlp done on post");
      }
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // calculate scores for each post
    function () {
      console.log("Q.deferred: calculate scores for each post");
      var deferred = Q.defer();
      // TODO : work
      console.log(" - TODO");
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // choose posts to vote on based on scores
    function () {
      console.log("Q.deferred: choose posts to vote on based on scores");
      var deferred = Q.defer();
      // TODO : work
      console.log(" - TODO");
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // cast votes to steem
    function () {
      console.log("Q.deferred: cast votes to steem");
      var deferred = Q.defer();
      // TODO : work
      console.log(" - TODO");
      // finish
      deferred.resolve(true);
      return deferred.promise;
    }
  ];

  var overallResult = function() {
    return processes.reduce(function(nextProcess, f) {
      return nextProcess.then(f);
    }, Q());
  };

  overallResult()
  .then(function(response) {
    if (response) {
      console.log("runBot finished successfully");
      sendEmail("Voter bot", "Update: runBot finished with these results: [test complete]");
      // TODO : log and email details of run
      return;
    }
  })
  .catch(function (err) {
    setError("stopped", false, err.message);
    sendEmail("Voter bot", "Update: runBot could not run: [error: "+err.message+"]");
  });
}

function runBotHelper_createVoterDetailsToPostsMetrics(voter) {

}


/*
* Steem access
*/

/*
initSteem():
* Initialize steem, test API connection and get minimal required data
*/
function initSteem() {
  testEnvVars();
  getUserAccount();
  // get last post
  getPersistentJson("lastpost", function(post) {
    if (post != null) {
      lastPost = post;
      console.log("got last post, id: "+lastPost.id);
    } else {
      console.log("no last post, probably this is first run for server");
    }
  });
}

/*
getUserAccount():
*/
function getUserAccount() {
  if (showFatalError()) {
    return;
  }
  if (process.env.STEEM_USER) {
    steem.api.getAccounts([process.env.STEEM_USER], function(err, result) {
      //console.log(err, result);
      if (err || result.length < 1) {
        setError("init_error", true, "Could not fetch STEEM_USER"+(err ? ": "+err.message : ""));
      } else {
        // check if user can vote, if not this app is useless
        if (!result[0].can_vote) {
          setError("init_error", true, "User "+process.env.STEEM_USER+"cannot vote!");
          return;
        }
        // save some values about this user in owner object
        owner.voting_power = result[0].voting_power;
        owner.last_post_time = (new Date() - getEpochMillis(result[0].last_root_post)) / 60000; // convert ms to mins
        steem.api.getDynamicGlobalProperties(function(err, properties) {
          //console.log(err, properties);
          if (err) {
            setError("init_error", false, "Can't get DynamicGlobalProperties, can't calculate user's Steem Power");
          } else {
            steemGlobalProperties = properties;
            owner.steem_power = getSteemPowerFromVest(result[0].vesting_shares);
          }
          // get followers
          steem.api.getFollowing(process.env.STEEM_USER, 0, null, 100, function(err, followersResult) {
            console.log("getFollowing");
            following = [];
            if (err) {
              setError("init_error", false, "Can't get following accounts");
            } else {
              for (var i = 0 ; i < followersResult.length ; i++) {
                following.push(followersResult[i].following);
              }
            }
            console.log(""+process.env.STEEM_USER+" follows: "+following);
          });
          // log owner object
          console.log("owner: "+JSON.stringify(owner));
        });
      }
    });
  }
}

/*
persistJson(key, json):
*/
function persistJson(key, json, error) {
  redisClient.on("error", function (err) {
    setError(null, false, "persistJson redit error for key "+key+": "+err);
    if (error) {
      error();
    }
  });
  redisClient.set(key, JSON.stringify(json), function() {
    console.log("persistJson save for key "+key);
  });
}

/*
getPersistentJson(key):
*/
function getPersistentJson(key, callback) {
  redisClient.on("error", function (err) {
    setError(null, false, "getPersistentJson redit _on_ error for key "+key+": "+err);
  });
  redisClient.get(key, function(err, reply) {
    if (reply == null) {
      setError(null, false, "getPersistentJson redit error for key "+key+": "+err);
      if (callback) {
        callback(null);
      }
    } else {
      if (callback) {
        try {
          var json = JSON.parse(reply);
          callback(json);
        } catch(err) {
          callback(null);
        }
      }
    }
  });
}

/*
* Steem Utils
*/

/*
getSteemPowerFromVest(vest):
* converts vesting steem (from get user query) to Steem Power (as on Steemit.com website)
*/
function getSteemPowerFromVest(vest) {
  try {
    return steem.formatter.vestToSteem(
      vest,
      parseFloat(steemGlobalProperties.total_vesting_shares),
      parseFloat(steemGlobalProperties.total_vesting_fund_steem)
    );
  } catch(err) {
    setError(null, false, "Error formatting owner vest shares to Steem");
  }
  return 0;
}

/*
getEpochMillis(dateStr):
* convert steem format date string to epoch millis (unix) format
*/
function getEpochMillis(dateStr) {
  var r = /^\s*(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\s*$/
    , m = (""+dateStr).match(r);
  return (m) ? Date.UTC(m[1], m[2]-1, m[3], m[4], m[5], m[6]) : undefined;
};


/*
* Manage internal state
*/

/*
setError(status, isFatal, message):
* Set general error for server
*/
function setError(status, isFatal, message) {
	if (status) {
    serverState = status;
  }
  fatalError = !fatalError && isFatal;
  console.log("setError to \""+serverState+"\" "+(isFatal ? "(FATAL) " : "")+(message ? ", "+message : ""));
}

/*
hasFatalError():
*/
function hasFatalError() {
	return fatalError;
}

/*
getServerState():
*/
function getServerState() {
	return serverState;
}

/*
showFatalError()
* Show message for fatal error check.
* return: true if fatal error
*/
function showFatalError() {
  if (fatalError) {
    console.log("cannot process initSteem function, fatal error has already occured. Please fix and restart server");
  }
  return fatalError;
}


/*
* Email
*/

/*
sendEmail(subject, message)
* Send email using SendGrid, if set up. Fails cleanly if not.
*/
function sendEmail(subject, message) {
	if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_ADDRESS_TO
    || process.env.EMAIL_ADDRESS_TO.localeCompare("none") == 0) {
		setError(null, false, "Can't send email, config vars not set. Subject: "+subject);
		return false;
	}
  console.log("sendEmail, subject: "+subject+", message: "+message);
	var helper = require('sendgrid').mail;
	var from_email = new helper.Email((process.env.EMAIL_ADDRESS_SENDER 
      && process.env.EMAIL_ADDRESS_SENDER.localeCompare("none") != 0)
		? process.env.EMAIL_ADDRESS_SENDER : 'bot@fossbot.org');
	var to_email = new helper.Email(process.env.EMAIL_ADDRESS_TO);
	var content = new helper.Content('text/plain', message);
	var mail = new helper.Mail(from_email, subject, to_email, content);

	var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON(),
	});

	console.log("sending email");
	sg.API(request, function(error, response) {
		console.log(" - "+response.statusCode);
		console.log(" - "+response.body);
		console.log(" - "+response.headers);
	});
}


/*
* Test functions
*/

/*
testEnvVars():
* Test environment variables and log results
*/
function testEnvVars() {
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
  console.log("api key?: "+(process.env.BOT_API_KEY ? "true" : "false"));
  if (!process.env.BOT_API_KEY) {
    setError("init_error", true, "No BOT_API_KEY config var set, minimum env vars requirements not met");
  }

  console.log("email address to: "+process.env.SENDGRID_API_KEY);
  console.log("email address to: "+process.env.EMAIL_ADDRESS_TO);
  console.log("email address sender: "+process.env.EMAIL_ADDRESS_SENDER);

  if (!fatalError) {
    serverState = "started";
  }
}


/* Set public API */
module.exports.runBot = runBot;
module.exports.testEnvVars = testEnvVars;
module.exports.initSteem = initSteem;
module.exports.setError = setError;
module.exports.hasFatalError = hasFatalError;
module.exports.getServerState = getServerState;
module.exports.showFatalError = showFatalError;
module.exports.sendEmail = sendEmail;