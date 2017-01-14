'use strict';

const
  alphanumOnlyRegex = new RegExp("([^a-zA-Z0-9])", 'g'),
  urlRegex = new RegExp("(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?", 'g'),
  glossaryBlacklist = ["http", "https", "I ve"],
  imagesExt = ["tif", "tiff", "gif", "jpeg", "jpg", "jif", "jfif", "jp2", "jpx", "j2k", "j2c", "fpx", "pcd", "png",
      "svg", "xcf", "bmp", "img", "ico"],
  videoDomains = ["youtube","youtu", "vimeo"];

const
	steem = require("steem"),
  Q = require("q"),
  redis = require("redis"),
  redisClient = require('redis').createClient(process.env.REDIS_URL),
  glossary = require("glossary")({minFreq: 3, collapse: true, blacklist: glossaryBlacklist}),
  S = require('string'),
  strip = require('strip-markdown'),
  remark = require('remark'),
  stripMarkdownProcessor = remark().use(strip),
  retext = require('retext'),
  sentiment = require('retext-sentiment');

const
  MINNOW = 0,
  DOLPHIN = 1,
  WHALE = 2;

const
  MAX_POST_TO_READ = 100,
  CAPITAL_DOLPHIN_MIN = 25000,
  CAPITAL_WHALE_MIN = 100000,
  MIN_KEYWORD_LEN = 4;

/* Private variables */
var fatalError = false;
var serverState = "stopped";

var steemGlobalProperties = {};

// algorithm
// - lists
var authorWhitelist = [];
var authorBlacklist = [];
var contentCategoryWhitelist = [];
var contentCategoryBlacklist = [];
var contentWordWhitelist = [];
var contentWordBlacklist = [];
var domainWhitelist = [];
var domainBlacklist = [];
// - main
// TODO : remove these test weights
var weights = [
  {key: "post_num_links_video", value: -10},
  {key: "post_num_words", value: 0.5, lower: 500, upper: 2000},
  {key: "author_is_followed", value: 50},
  {key: "post_voted_any_whale", value: 20},
  {key: "post_voted_num_dolphin", value: 5},
  {key: "author_repuation", value: 10, lower: 25, upper: 75},
  {key: "post_num_votes", value: -2}
];

// data
var posts = [];
var postsNlp = [];
var lastPost = null;
var users = [];
var following = [];
// metrics
var owner = {};
var postsMetrics = [];
// resulting
var scores = [];
var postsMetadata = [];

var log = "";

/*
* Bot logic
*/

/*
persistentLog(msg):
* Logs to console and appends to log var
*/
function persistentLog(msg) {
  console.log(msg);
  log += ((log.length > 0) ? "\n" : "") + msg;
}

/*
runBot(messageCallback):
* Process a bot iteration
*/
function runBot(callback) {
  console.log("mainLoop: started, state: "+serverState);
  // first, check bot can run
  if (fatalError) {
    if (callback) {
      callback({status: 500, message: "Server in unusable state, cannot run bot"});
    }
    sendEmail("Voter bot", "Update: runBot could not run: [fatalError with state: "+serverState+"]");
    return;
  }
  // begin bot logic, use promises with Q
  // some general vars
  var timeNow = new Date();
  // define steps processes
  var processes = [
    // get posts
    function () {
      log = "";
      persistentLog("Q.deffered: get posts");
      var deferred = Q.defer();
      // get posts
      steem.api.getDiscussionsByCreated({limit: MAX_POST_TO_READ}, function(err, result) {
        //persistentLog(err, result);
        if (err) {
          throw {message: "Error reading posts from steem: "+err.message};
        }
        posts = result;
        persistentLog(" - num fetched posts: "+posts.length);
        deferred.resolve(true);
        // TODO : save posts
      });
      return deferred.promise;
    },
    // clean posts and update last fetched post
    function () {
      persistentLog("Q.deferred: clean posts");
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
      persistentLog(" - num new posts: "+posts.length);
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 1, get owner metrics 
    function () {
      persistentLog("Q.deferred: transform post data to metrics 1, get owner metrics ");
      var deferred = Q.defer();
      // get this user's votes
      persistentLog(" - count this user's votes today");
      steem.api.getAccountVotes(process.env.STEEM_USER, function(err, votes) {
        //persistentLog(err, votes);
        var num_votes_today = 0;
        if (err) {
          persistentLog(" - error, can't get "+process.env.STEEM_USER+" votes: "+err.message);
        } else {
          for (var i = 0 ; i < votes.length ; i++) {
            if ((timeNow - getEpochMillis(votes[i].time)) < (1000 * 60 * 60 * 24)) {
              num_votes_today++;
            }
          }
        }
        // finish
        owner.num_votes_today = num_votes_today;
        persistentLog(" - num_votes_today: "+num_votes_today);
        deferred.resolve(num_votes_today > 0);
      });
      return deferred.promise;
    },
    // transform post data to metrics 2, basic post metrics
    function () {
      persistentLog("Q.deferred: transform post data to metrics 2, basic post metrics");
      var deferred = Q.defer();
      // create metrics for posts
      //persistentLog(" - ");
      postsMetrics = [];
      var fetchUsers = [];
      for (var i = 0 ; i < posts.length ; i++) {
        persistentLog(" - post ["+posts[i].permlink+"]");
        var metric = {};
        // post_alive_time: Time since post, in minutes
        var postTimeStamp = getEpochMillis(posts[i].created);
        var alive_time = 0;
        if (postTimeStamp != 0) {
          alive_time = (timeNow - postTimeStamp) / (1000 * 60);
        }
        metric.post_alive_time = alive_time;
        persistentLog(" - - metrics.post.alive_time: "+metric.post_alive_time);
        //post_est_payout: Estimated payout
        metric.post_est_payout = parseFloat(posts[i].total_pending_payout_value);
        persistentLog(" - - metrics.post.est_payout: "+metric.post_est_payout);
        //post_num_votes: Number of votes
        metric.post_num_votes = posts[i].net_votes;
        persistentLog(" - - metrics.post.num_votes: "+metric.post_num_votes);
        // add author and voters to user fetch list
        fetchUsers.push(posts[i].author);
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          //persistentLog(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
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
            persistentLog(" - error, can't get "+voter+" votes: "+err.message);
          } else {
            for (var k = 0 ; k < userAccounts.length ; k++) { 
              users[userAccounts[k].name] = userAccounts[k];
            }
          }
          // finish
          persistentLog(" - - finished getting voters for post");
          deferred.resolve(true);
        });
      } else {
        // finish
        persistentLog(" - - no voters account information to get for post");
        deferred.resolve(true);
      }
      // return promise
      return deferred.promise;
    },
    // transform post data to metrics 3, analyse votes
    function () {
      persistentLog("Q.deferred: transform post data to metrics 3, analyse votes");
      var deferred = Q.defer();
      // analyse votes for posts
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(" - postsMetrics ["+i+"]");
        // *** VOTES IN DETAIL
        // note, should do this last, has complex nesting that we need to use Q to sort out
        //persistentLog(" - - * VOTES IN DETAIL");
        var numDolphins = 0;
        var numWhales = 0;
        var numFollowed = 0;
        var numWhitelisted = 0;
        var numBlacklisted = 0;
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          //persistentLog(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
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
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 4, post author metrics
    function () {
      persistentLog("Q.deferred: transform post data to metrics 4, post author metrics");
      var deferred = Q.defer();
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(" - postsMetrics ["+i+"]");
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
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 5, do NLP processing
    function () {
      persistentLog("Q.deferred: transform post data to metrics 5, do NLP processing");
      var deferred = Q.defer();
      postsNlp = [];
      var postCount = 0;
      for (var i = 0 ; i < posts.length ; i++) {
        persistentLog(" - post ["+posts[i].permlink+"]");
        var nlp = {};
        // sanitize body content, make plaintext, remove HTML tags and non-latin characters
        nlp.content = posts[i].body;
        nlp.content = new String(stripMarkdownProcessor.process(nlp.content));
        nlp.content = S(nlp.content)
          .decodeHTMLEntities()
          .unescapeHTML()
          .stripTags()
          .latinise()
          .s;
        // remove markdown formatting
        persistentLog(" - - nlp.content: "+nlp.content);
        // get keywords from alphanumberic only, and in lower case to stop different case duplicates
        var alphaNumericContent = nlp.content.replace(alphanumOnlyRegex," ").toLowerCase();
        //persistentLog(" - - - alphaNumericContent: "+alphaNumericContent);
        var keywords = glossary.extract(alphaNumericContent);
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
        persistentLog(" - - nlp.keywords: "+nlp.keywords);
        persistentLog(" - - - removed "+removedCount+" short keywords");
        // get all url links
        nlp.urls = [];
        var urlResult;
        while((urlResult = urlRegex.exec(nlp.content)) !== null) {
          nlp.urls.push(urlResult[0]);
        }
        persistentLog(" - - nlp.urls: "+JSON.stringify(nlp.urls));
        // sentiment
        retext()
          .use(sentiment)
          .use(function () {
            return transformer;
            function transformer(tree) {
              try {
                nlp.sentiment = tree.data.polarity;
              } catch (err) {
                nlp.sentiment = 0;
                persistentLog(" - - - sentiment extraction error: "+err.message);
              }
              persistentLog(" - - nlp.sentiment: "+nlp.sentiment);
              postsNlp.push(nlp);
              // count words using tree, i.e. count WordNode instances
              nlp.num_words = countWordsFromRetext(tree);
              persistentLog(" - - nlp.num_words: "+nlp.num_words);
              // commit to postsNlp
              persistentLog(" - - nlp done on post");
              postCount++;
              if (postCount == posts.length) {
                // finish
                deferred.resolve(true);
              }
            }
          })
          .process(nlp.content);
      }
      return deferred.promise;
    },
    // transform post data to metrics 6, calc cultural metrics, content
    function () {
      persistentLog("Q.deferred: transform post data to metrics 6, calc cultural metrics, content - textpost");
      var deferred = Q.defer();
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(" - postsMetrics ["+i+"]");
        var nlp = postsNlp[i];
        // content - text
        postsMetrics[i].post_num_chars = nlp.content.length;
        postsMetrics[i].post_num_words = nlp.num_words;
        postsMetrics[i].post_sentiment_val = nlp.sentiment;
        // - zero vals
        postsMetrics[i].post_num_tags_whitelisted = 0;
        postsMetrics[i].post_num_tags_blacklisted = 0;

        if (posts[i].hasOwnProperty("json_metadata")) {
          try {
            var metadata = JSON.parse(posts[i].json_metadata);
            if (metadata && metadata.hasOwnProperty("tags")) {
              persistentLog(" - - checking tags");
              for (var j = 0 ; j < metadata.tags.length ; j++) {
                var tag = metadata.tags[j];
                postsMetrics[i].post_num_tags_whitelisted += (contentWordWhitelist.indexOf(tag) > 0) ? 1 : 0;
                postsMetrics[i].post_num_tags_blacklisted += (contentWordBlacklist.indexOf(tag) > 0) ? 1 : 0;
              }
            } else {
              persistentLog(" - - no tags to check");
            }
          } catch(err) {
            persistentLog(" - - no tags to check, err: "+err.message);
          }
        } else {
          persistentLog(" - - no tags to check");
        }
        postsMetrics[i].post_num_keywords_whitelisted = 0;
        postsMetrics[i].post_num_keywords_blacklisted = 0;
        postsMetrics[i].post_num_words_whitelisted = 0;
        postsMetrics[i].post_num_words_blacklisted = 0;
        persistentLog(" - - checking keywords");
        for (var j = 0 ; j < nlp.keywords.length ; j++) {
          var keyword = nlp.keywords[j];
          postsMetrics[i].post_num_keywords_whitelisted += (contentWordWhitelist.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_keywords_blacklisted += (contentWordBlacklist.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_words_whitelisted += (nlp.content.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_words_blacklisted += (nlp.content.indexOf(keyword) > 0) ? 1 : 0;
        }
        // - bool
        postsMetrics[i].post_category_whitelisted = (contentCategoryWhitelist.indexOf(posts[i].category) > 0) ? 1 : 0;
        postsMetrics[i].post_category_blacklisted = (contentCategoryBlacklist.indexOf(posts[i].category) > 0) ? 1 : 0;
        postsMetrics[i].post_any_tag_whitelisted = (postsMetrics[i].post_num_tags_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_any_tag_blacklisted = (postsMetrics[i].post_num_tags_blacklisted > 0) ? 1 : 0;
        postsMetrics[i].post_any_keyword_whitelisted = (postsMetrics[i].post_num_keywords_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_any_keyword_blacklisted = (postsMetrics[i].post_num_keywords_blacklisted > 0) ? 1 : 0;
        // content - links
        // - zero vals
        postsMetrics[i].post_num_links_video = 0;
        postsMetrics[i].post_num_links_image = 0;
        postsMetrics[i].post_num_links_page = 0;
        postsMetrics[i].post_num_links_total = 0; 
        postsMetrics[i].post_num_link_domains_whitelisted = 0;
        postsMetrics[i].post_num_link_domains_blacklisted = 0;
        persistentLog(" - - classifying urls");
        for (var j = 0 ; j < nlp.urls.length ; j++) {
          var url = nlp.urls[j];
          postsMetrics[i].post_num_links_total++;
          persistentLog(" - - - url: "+url);
          // get domain
          var domain = "";
          var urlParts = S(url).splitLeft("//", 1);
          if (urlParts && urlParts.length > 1) {
            var urlSubParts = S(urlParts[1]).splitLeft("/", 1);
            if (urlSubParts && urlSubParts.length >= 1) {
              var domainParts = S(urlSubParts[0]).splitLeft(".", 1);
              if (domainParts && domainParts.length > 2) {
                domain = domainParts[1];
              } else if (domainParts.length > 0) {
                domain = domainParts[0];
              } // else failed, leave domain blank
            }
          }
          persistentLog(" - - - domain: "+domain);
          // track matching progress
          var match = false;
          // check if is image
          for (var k = 0 ; k < imagesExt.length ; k++) {
            if (S(url).endsWith("."+imagesExt[k])) {
              postsMetrics[i].post_num_links_image++;
              persistentLog(" - - - - is image");
              match = true;
              break;
            }
          }
          // check if is video link
          if (!match) {
            if (videoDomains.indexOf(domain) > 0) {
              postsMetrics[i].post_num_links_video++;
              persistentLog(" - - - - is video");
              match = true;
            }
          }
          // if not image or video, assume is normal webpage
          if (!match) {
            postsMetrics[i].post_num_links_page++;
          }
          // check for domain presence on white / black list
          postsMetrics[i].post_num_link_domains_whitelisted += (domainWhitelist.indexOf(domain) > 0) ? 1 : 0;
          postsMetrics[i].post_num_link_domains_blacklisted += (domainBlacklist.indexOf(domain) > 0) ? 1 : 0;
        }
        postsMetrics[i].post_any_link_domains_whitelisted = (postsMetrics[i].post_num_link_domains_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_any_link_domains_blacklisted = (postsMetrics[i].post_num_link_domains_blacklisted > 0) ? 1 : 0;
        // author metrics
        postsMetrics[i].author_repuation = steem.formatter.reputation(posts[i].author_reputation);
      }
      // finish
      persistentLog(" - finished gathering metrics");
      persistentLog(" - postsMetrics array: "+JSON.stringify(postsMetrics));
      deferred.resolve(true);
      return deferred.promise;
    },
    // calculate scores for each post
    function () {
      persistentLog("Q.deferred: calculate scores for each post");
      var deferred = Q.defer();
      // calculate scores
      scores = [];
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(" - - score for post "+i);
        var metric = postsMetrics[i];
        scores[i] = 0;
        for (var j = 0 ; j < weights.length ; j++) {
          if (metric.hasOwnProperty(weights[j].key)) {
            persistentLog(" - - - metric key: "+weights[j].key);
            var value = metric[weights[j].key];
            var weight = weights[j].value;
            if (weights[j].hasOwnProperty("lower")) { //must at least have lower defined, upper is optional
              var lower = 0;
              var upper = Number.MAX_VALUE;
              if (weights[j].hasOwnProperty("lower")) {
                lower = weights[j].lower;
              }
              if (weights[j].hasOwnProperty("upper")) {
                upper = weights[j].upper;
              }
              persistentLog(" - - - - - bounding metric("+value+") for range "+lower+" to "+upper);
              if (value < lower) {
                value = 0;
              } else if (value > upper) {
                value = (upper - lower);
              } else {
                value -= lower;
              }
              persistentLog(" - - - - - after bounding: "+value);
            }
            var result = value * weight;
            persistentLog(" - - - - metric ("+value+") * weight("+weight+") = "+result);
            scores[i] += result;
          } else {
            persistentLog(" - - - - error, key not found in metrics: "+weight);
          }
        }
        persistentLog(" - - final score: "+scores[i]);
      }
      // finish
      persistentLog(" - scores: "+JSON.stringify(scores));
      deferred.resolve(true);
      return deferred.promise;
    },
    // choose posts to vote on based on scores
    function () {
      persistentLog("Q.deferred: choose posts to vote on based on scores");
      var deferred = Q.defer();
      // TODO : work
      persistentLog(" - TODO");
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // cast votes to steem
    function () {
      persistentLog("Q.deferred: cast votes to steem");
      var deferred = Q.defer();
      // TODO : work
      persistentLog(" - TODO");
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // send result messages
    function () {
      persistentLog("Q.deferred: cast votes to steem");
      var deferred = Q.defer();
      // back to http
      postsMetadata = [];
      for (var i = 0 ; i < posts.length ; i++) {
        var metadata = {};
        metadata.title = posts[i].title;
        metadata.url = "https://steemit.com"+posts[i].url;
        metadata.author = posts[i].author;
        metadata.time = posts[i].created;
        metadata.score = scores[i];
        postsMetadata.push(metadata);
      }
      if (callback) {
        callback(
          {
            status: 200, 
            message: "Scores caluclated, but posts not decided on and no votes cast, this is a demo server.",
            posts: postsMetadata
          });
      }
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
      persistentLog("runBot finished successfully");
      var email = "<html><body><h1>Update: runBot iteration finished successfully</h1>"
        + "<h2>Posts and scores:</h2>";
      if (postsMetadata.length > 0) {
        for (var i = 0 ; i < postsMetadata.length ; i++) {
          email += "<p><strong>Score "+postsMetadata[i].score+"</strong> for "
            +"<a href=\""+postsMetadata[i].url+"\"><strong>"+postsMetadata[i].title+"</strong></a>"
            + " by author "+postsMetadata[i].author + "</p>";
        }
      } else {
        email += "<p><strong>No new posts found</strong></p>";
      }
      email += "</hr>"
      email += "<h2>User weights and config:</h2>";
      email += "<h3>Weights</h3>";
      var weightsHtml = JSON.stringify(postsMetadata, null, 4).replace('\n', "<p/><p>");
      email += "<p>"+weightsHtml+"</p>";
      email += "<h3>White and black lists</h3>";
      email += "<p>Author whitelist: "+JSON.stringify(authorWhitelist)+"</p>";
      email += "<p>Author blacklist: "+JSON.stringify(authorBlacklist)+"</p>";
      email += "<p>Content category whitelist: "+JSON.stringify(contentCategoryWhitelist)+"</p>";
      email += "<p>Content category blacklist: "+JSON.stringify(contentCategoryBlacklist)+"</p>";
      email += "<p>Content word whitelist: "+JSON.stringify(contentWordWhitelist)+"</p>";
      email += "<p>Content word blacklist: "+JSON.stringify(contentWordBlacklist)+"</p>";
      email += "<p>Domain whitelist: "+JSON.stringify(domainWhitelist)+"</p>";
      email += "<p>Domain blacklist: "+JSON.stringify(domainBlacklist)+"</p>";
      email += "<h3>Misc vars</h3>";
      email += "<p>Max posts to get: "+MAX_POST_TO_READ+"</p>";
      email += "<p>Dolpin min SP: "+CAPITAL_DOLPHIN_MIN+"</p>";
      email += "<p>Whale min SP: "+CAPITAL_WHALE_MIN+"</p>";
      email += "<p>Key detector, min keyword length: "+MIN_KEYWORD_LEN+"</p>";
      email += "<h2>Raw results metadata:</h2>";
      var metadataHtml = JSON.stringify(postsMetadata, null, 4).replace('\n', "<p/><p>");
      email += "<p>"+metadataHtml+"</p>";
      email += "<h3>Process logs:</h3>";
      var logHtml = log.replace('\n', "<p/><p>");
      email += "<p>"+logHtml+"</p>";
      email += "</body></html>";
      sendEmail("Voter bot", email, true);
      return;
    }
  })
  .catch(function (err) {
    setError("stopped", false, err.message);
    // TODO : use log
    sendEmail("Voter bot", "Update: runBot could not run: [error: "+err.message+"]");
  });
}

function countWordsFromRetext(obj) {
  if (obj != null) {
    if (obj.type.localeCompare("WordNode") == 0) {
      return 1;
    } else if (obj.children && obj.children.length > 0) {
      var sum = 0;
      for (var i = 0 ; i < obj.children.length ; i++) {
        sum += countWordsFromRetext(obj.children[i]);
      }
      return sum;
    }
  }
  return 0;
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
function sendEmail(subject, message, isHtml) {
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
	var content = new helper.Content(isHtml ? 'text/html' : 'text/plain', message);
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