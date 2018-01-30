'use strict';

const
  LOG_GENERAL = 0,
  LOG_VERBOSE = 1
    ;

const
  alphanumOnlyRegex = new RegExp("([^a-zA-Z0-9])", 'g'),
  urlRegex = new RegExp("(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?", 'g'),
  glossaryBlacklist = ["http", "https", "I ve"],
  imagesExt = ["tif", "tiff", "gif", "jpeg", "jpg", "jif", "jfif", "jp2", "jpx", "j2k", "j2c", "fpx", "pcd", "png",
      "svg", "xcf", "bmp", "img", "ico"],
  videoDomains = ["youtube","youtu", "vimeo", "atch"],
  metricKeys = [
      "owner_num_votes_today",
      "owner_last_post_time",
      "post_alive_time",
      "post_est_payout",
      "post_num_upvotes",
      "post_num_downvotes",
      "post_up_voted_num_dolphin",
      "post_up_voted_num_whale",
      "post_up_voted_num_followed",
      "post_up_voted_num_whitelisted",
      "post_up_voted_num_blacklisted",
      "post_down_voted_num_dolphin",
      "post_down_voted_num_whale",
      "post_down_voted_num_followed",
      "post_down_voted_num_whitelisted",
      "post_down_voted_num_blacklisted",
      "post_up_voted_any_dolphin",
      "post_up_voted_any_whale",
      "post_up_voted_any_followed",
      "post_up_voted_any_whitelisted",
      "post_up_voted_any_blacklisted",
      "post_down_voted_any_dolphin",
      "post_down_voted_any_whale",
      "post_down_voted_any_followed",
      "post_down_voted_any_whitelisted",
      "post_down_voted_any_blacklisted",
      "author_capital_val",
      "author_is_minnow",
      "author_is_dolphin",
      "author_is_whale",
      "author_is_followed",
      "author_is_whitelisted",
      "author_is_blacklisted",
      "post_num_chars",
      "post_num_words",
      "post_sentiment_val",
      "post_num_tags_whitelisted",
      "post_num_tags_blacklisted",
      "post_num_keywords_whitelisted",
      "post_num_keywords_blacklisted",
      "post_num_words_whitelisted",
      "post_num_words_blacklisted",
      "post_category_whitelisted",
      "post_category_blacklisted",
      "post_any_tag_whitelisted",
      "post_any_tag_blacklisted",
      "post_any_keyword_whitelisted",
      "post_any_keyword_blacklisted",
      "post_num_links_video",
      "post_num_links_image",
      "post_num_links_page",
      "post_num_links_total",
      "post_num_link_domains_whitelisted",
      "post_num_link_domains_blacklisted",
      "post_any_link_domains_whitelisted",
      "post_any_link_domains_blacklisted",
      "author_repuation",
      "post_very_short",
      "post_images_only",
      "post_videos_only",
      "post_mixed_links_only",
      "post_has_english_language_use",
      "post_has_german_language_use",
      "post_has_spanish_language_use",
      "post_has_french_language_use"
      ];

const
  metricKeys_basic = [
    "owner_num_votes_today",
    "owner_last_post_time",
    "post_alive_time",
    "post_est_payout",
    "post_num_upvotes",
    "post_num_downvotes"
  ],
  metricKeys_voting = [
    "post_up_voted_num_dolphin",
    "post_up_voted_num_whale",
    "post_up_voted_num_followed",
    "post_up_voted_num_whitelisted",
    "post_up_voted_num_blacklisted",
    "post_down_voted_num_dolphin",
    "post_down_voted_num_whale",
    "post_down_voted_num_followed",
    "post_down_voted_num_whitelisted",
    "post_down_voted_num_blacklisted",
    "post_up_voted_any_dolphin",
    "post_up_voted_any_whale",
    "post_up_voted_any_followed",
    "post_up_voted_any_whitelisted",
    "post_up_voted_any_blacklisted",
    "post_down_voted_any_dolphin",
    "post_down_voted_any_whale",
    "post_down_voted_any_followed",
    "post_down_voted_any_whitelisted",
    "post_down_voted_any_blacklisted"
  ],
  metricKeys_author = [
    "author_capital_val",
    "author_is_minnow",
    "author_is_dolphin",
    "author_is_whale",
    "author_is_followed",
    "author_is_whitelisted",
    "author_is_blacklisted"
  ],
  metricKeys_nlp_lists_links_lang = [
    "post_num_chars",
    "post_num_words",
    "post_sentiment_val",
    "post_num_tags_whitelisted",
    "post_num_tags_blacklisted",
    "post_num_keywords_whitelisted",
    "post_num_keywords_blacklisted",
    "post_num_words_whitelisted",
    "post_num_words_blacklisted",
    "post_category_whitelisted",
    "post_category_blacklisted",
    "post_any_tag_whitelisted",
    "post_any_tag_blacklisted",
    "post_any_keyword_whitelisted",
    "post_any_keyword_blacklisted",
    "post_num_links_video",
    "post_num_links_image",
    "post_num_links_page",
    "post_num_links_total",
    "post_num_link_domains_whitelisted",
    "post_num_link_domains_blacklisted",
    "post_any_link_domains_whitelisted",
    "post_any_link_domains_blacklisted",
    "author_repuation",
    "post_very_short",
    "post_images_only",
    "post_videos_only",
    "post_mixed_links_only",
    "post_has_english_language_use",
    "post_has_german_language_use",
    "post_has_spanish_language_use",
    "post_has_french_language_use"
  ];

const
	steem = require("steem"),
  Q = require("q"),
  Glossary = require("glossary"),
  S = require('string'),
  strip = require('strip-markdown'),
  remark = require('remark'),
  stripMarkdownProcessor = remark().use(strip),
  retext = require('retext'),
  sentiment = require('retext-sentiment'),
  wait = require('wait.for'),
  extra = require('./extra.js'),
  LanguageDetect = require('languagedetect'),
  langDetector = new LanguageDetect(),
  moment_tz = require('moment-timezone'),
  moment = require('moment'),
  mongodb = require("mongodb");

const
  DB_GENERAL = "general",
  DB_ALGORITHM = "algorithm",
  DB_CONFIG_VARS = "config_vars",
  DB_AVG_WINDOW_INFO = "avg_window_info",
  DB_LAST_POST = "last_post",
  DB_DAILY_LIKED_POSTS = "daily_liked_posts",
  DB_POSTS_METADATA = "posts_metadata";

const
  MILLIS_IN_DAY = 86400000,
  MAX_POST_TO_READ_PER_QUERY = 100;

var defaultConfigVars = {
  MAX_POST_TO_READ: 400,
  CAPITAL_DOLPHIN_MIN: 25000,
  CAPITAL_WHALE_MIN: 100000,
  MIN_KEYWORD_LEN: 4,
  MIN_SCORE_THRESHOLD: 10,
  SCORE_THRESHOLD_INC_PC: 0.1,
  NUM_POSTS_FOR_AVG_WINDOW: 10,
  MIN_WORDS_FOR_ARTICLE: 100,
  DAYS_KEEP_LOGS: 2,
  MIN_POST_AGE_TO_CONSIDER: 21.22,
  MIN_LANGUAGE_USAGE_PC: 0.1,
  TIME_ZONE: "Etc/GMT+3",
  MIN_KEYWORD_FREQ: 3,
  MIN_VOTING_POWER: 50,
  VOTE_VOTING_POWER: 100
};

var configVars = {
  MAX_POST_TO_READ: 800,
  CAPITAL_DOLPHIN_MIN: 25000,
  CAPITAL_WHALE_MIN: 100000,
  MIN_KEYWORD_LEN: 4,
  MIN_SCORE_THRESHOLD: 10,
  SCORE_THRESHOLD_INC_PC: 0.1,
  NUM_POSTS_FOR_AVG_WINDOW: 10,
  MIN_WORDS_FOR_ARTICLE: 100,
  DAYS_KEEP_LOGS: 2,
  MIN_POST_AGE_TO_CONSIDER: 30,
  MIN_LANGUAGE_USAGE_PC: 0.1,
  TIME_ZONE: "Etc/GMT+3",
  MIN_KEYWORD_FREQ: 3,
  MIN_VOTING_POWER: 50,
  VOTE_VOTING_POWER: 100
};

// MongoDB
var db;

/* Private variables */
var steemGlobalProperties = {};

// algorithm
// - lists
var algorithm = {
  weights: [],
  authorWhitelist: [],
  authorBlacklist: [],
  contentCategoryWhitelist: [],
  contentCategoryBlacklist: [],
  contentWordWhitelist: [],
  contentWordBlacklist: [],
  domainWhitelist: [],
  domainBlacklist: []
};
var algorithmUsesVotingAnalysis = false;
var algorithmUsesAuthorAnalysis = false;
var algorithmUsesNlpListsLinksLangAnalysis = false;

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
var postsMetadata = [];

// other
var avgWindowInfo = {
  scoreThreshold: 0,
  postScores: [],
  windowSize: configVars.NUM_POSTS_FOR_AVG_WINDOW
};

// logging and notification
var numVoteOn = 0;
var logNumLines = 0;
var log = "";
var logHtml = "";
var algorithmSet = false;

/*
* Bot logic
*/

var verboseLoggingEnabled = false;

/*
setupLogging()
* Initialize logging based on environment variable
*/
function setupLogging() {
  verboseLoggingEnabled = process.env.VERBOSE_LOGGING !== undefined
        && process.env.VERBOSE_LOGGING !== null
        && process.env.VERBOSE_LOGGING.toLowerCase().localeCompare("true") === 0;
}

/*
persistentLog(msg):
* Logs to console and appends to log var
*/
function persistentLog(level, msg) {
  if (verboseLoggingEnabled || level === LOG_GENERAL) {
    console.log(msg);
  }
  log += ((log.length > 0) ? "\n" : "") + msg;
  logHtml += ((logHtml.length > 0) ? "<br/>" : "") + msg;
}

/*
runBot(messageCallback):
* Process a bot iteration
*/
function runBot(callback, options) {
  persistentLog(LOG_GENERAL, "runBot started...");
  // begin bot logic, use promises with Q
  // some general vars
  var timeNow = new Date();
  // define steps processes
  var processes = [
    // initial vote power check
    function () {
      persistentLog(LOG_GENERAL, "checking we have enough voting power...");
      var deferred = Q.defer();
      // get posts
      var percentageVp = owner.voting_power / 100;
      persistentLog(LOG_VERBOSE, "Enough voting power ("+percentageVp+" < "+configVars.MIN_VOTING_POWER+") ?");
      if (percentageVp < configVars.MIN_VOTING_POWER) {
        persistentLog(LOG_GENERAL, " - voting power "+percentageVp+
          " is less than config min of " + configVars.MIN_VOTING_POWER+
          ", will not continue");
        throw {message: "Not enough voting power ("+percentageVp+" < "+configVars.MIN_VOTING_POWER+")"};
      }
      deferred.resolve(true);
      return deferred.promise;
    },
    // pre set up
    function () {
      numVoteOn = 0;
      log = "";
      persistentLog(LOG_GENERAL, "pre set up...");
      var deferred = Q.defer();
      // update average window details
      getPersistentObj(DB_AVG_WINDOW_INFO, function(err, info) {
        if (err || info === undefined || info == null) {
          persistentLog(LOG_VERBOSE, " - no avgWindowInfo in db, probably" +
            " first time bot run");
          avgWindowInfo = {
            scoreThreshold: 0,
            postScores: [],
            windowSize: configVars.NUM_POSTS_FOR_AVG_WINDOW
          };
        } else {
          avgWindowInfo = info;
          persistentLog(LOG_VERBOSE, " - updated avgWindowInfo from db: "+JSON.stringify(avgWindowInfo));
        }
        getPersistentObj(DB_ALGORITHM, function(err, algorithmResult) {
          if (err || algorithmResult === undefined || algorithmResult === null) {
            algorithmSet = false;
            persistentLog(LOG_VERBOSE, " - no algorithm in db, empty");
            algorithm = {
              weights: [],
              authorWhitelist: [],
              authorBlacklist: [],
              contentCategoryWhitelist: [],
              contentCategoryBlacklist: [],
              contentWordWhitelist: [],
              contentWordBlacklist: [],
              domainWhitelist: [],
              domainBlacklist: []
            };
            // #8, make all white / black list items lowercase
            algorithm.authorWhitelist = stringListToLowerCase(algorithm.authorWhitelist);
            algorithm.authorBlacklist = stringListToLowerCase(algorithm.authorBlacklist);
            algorithm.contentCategoryWhitelist = stringListToLowerCase(algorithm.contentCategoryWhitelist);
            algorithm.contentCategoryBlacklist = stringListToLowerCase(algorithm.contentCategoryBlacklist);
            algorithm.contentWordWhitelist = stringListToLowerCase(algorithm.contentWordWhitelist);
            algorithm.contentWordBlacklist = stringListToLowerCase(algorithm.contentWordBlacklist);
            algorithm.domainWhitelist = stringListToLowerCase(algorithm.domainWhitelist);
            algorithm.domainBlacklist = stringListToLowerCase(algorithm.domainBlacklist);
          } else {
            algorithmSet = true;
            algorithm = algorithmResult;
            persistentLog(LOG_VERBOSE, " - updated algorithm from db: "+JSON.stringify(algorithm));
          }
          // determine which analysis needs to be run depending on algorithm keys used
          for (var i = 0 ; i < algorithm.weights.length ; i++) {
            for (var j = 0 ; j < metricKeys_voting.length ; j++) {
              if (algorithm.weights[i].key.localeCompare(metricKeys_voting[j]) == 0) {
                algorithmUsesVotingAnalysis = true;
                break;
              }
            }
            if (algorithmUsesVotingAnalysis) {
              break;
            }
          }
          for (var i = 0 ; i < algorithm.weights.length ; i++) {
            for (var j = 0 ; j < metricKeys_author.length ; j++) {
              if (algorithm.weights[i].key.localeCompare(metricKeys_author[j]) == 0) {
                algorithmUsesAuthorAnalysis = true;
                break;
              }
            }
            if (algorithmUsesAuthorAnalysis) {
              break;
            }
          }
          for (var i = 0 ; i < algorithm.weights.length ; i++) {
            for (var j = 0 ; j < metricKeys_nlp_lists_links_lang.length ; j++) {
              if (algorithm.weights[i].key.localeCompare(metricKeys_nlp_lists_links_lang[j]) == 0) {
                algorithmUsesNlpListsLinksLangAnalysis = true;
                break;
              }
            }
            if (algorithmUsesNlpListsLinksLangAnalysis) {
              break;
            }
          }
          getPersistentObj(DB_CONFIG_VARS, function(err, configVarsResult) {
            if (err || configVarsResult === undefined || configVarsResult === null) {
              persistentLog(LOG_VERBOSE, " - couldnt update config, using default: "+JSON.stringify(configVars));
            } else {
              configVars = configVarsResult;
              persistentLog(LOG_VERBOSE, " - updated config from db: "+JSON.stringify(configVars));
            }
            deferred.resolve(true);
          });
        });
      });
      return deferred.promise;
    },
    // get posts
    function () {
      persistentLog(LOG_GENERAL, "getting recent posts...");
      var deferred = Q.defer();
      // get posts
      if (options && options.hasOwnProperty("author")
            && options.hasOwnProperty("permlink")) {
        persistentLog(LOG_VERBOSE, " - get post by author: "+options.author+", permlink: "+options.permlink);
        steem.api.getContent(options.author, options.permlink, function(err, post) {
          if (err) {
            throw {message: "Error reading post for permlink: "+options.permlink};
          }
          persistentLog(LOG_VERBOSE, " - got post by permlink: "+JSON.stringify(post));
          posts = [post];
          deferred.resolve(true);
        });
      } else {
        persistentLog(LOG_VERBOSE, " - getting posts (recursive)");
        getPosts_recursive([], lastPost, configVars.MAX_POST_TO_READ, function(err, result) {
          if (err || result == null || result === undefined) {
            throw {message: "Error reading posts from steem: "+err.message};
          }
          posts = result;
          persistentLog(LOG_GENERAL, " - num fetched posts: "+posts.length);
          deferred.resolve(true);
        });
      }
      return deferred.promise;
    },
    // clean posts and update last fetched post
    function () {
      persistentLog(LOG_GENERAL, "filter posts...");
      var deferred = Q.defer();
      if (options && options.hasOwnProperty("permlink")) {
        // do nothing, posts should just contain permlink
      } else if (options && options.hasOwnProperty("limit")) {
        // keep options.limit number of posts
        var cleanedPosts = [];
        for (var i = 0 ; i < posts.length ; i++) {
          if (cleanedPosts.length >= options.limit) {
            break;
          }
          cleanedPosts.push(posts[i]);
        }
        posts = cleanedPosts;
      } else {
        // only keep posts older than limit and that are not written by the registered (this) user
        if (configVars.MIN_POST_AGE_TO_CONSIDER > 0) {
          var now = (new Date()).getTime();
          var cleanedPosts = [];
          for (var i = 0 ; i < posts.length ; i++) {
            var timeDiff = now - getEpochMillis(posts[i].created);
            if (timeDiff > 0) {
              timeDiff /= (60 * 1000);
            }
            // #1, if author is this user, remove post, i.e. disallow vote on own post
            var isByThisUser = process.env.STEEM_USER !== undefined
                && process.env.STEEM_USER !== null
                && posts[i].author !== undefined
                && posts[i].author !== null
                && posts[i].author.localeCompare(process.env.STEEM_USER) === 0;
            if (timeDiff >= configVars.MIN_POST_AGE_TO_CONSIDER
                && !isByThisUser) {
              cleanedPosts.push(posts[i]);
            }
          }
          posts = cleanedPosts;
        }
      }
      // throw nice error if no posts left
      if (posts.length < 1) {
        // #78, add information of potential config issue here
        throw {message: "No new posts since last post and within MIN_POST_AGE_TO_CONSIDER of "+configVars.MIN_POST_AGE_TO_CONSIDER+" minutes."
            + "\nPlease note that MAX_POST_TO_READ value is set to "+configVars.MAX_POST_TO_READ+" in your config."
            + "\nYou may need to increase this number. Please see the FAQ."};
      }
      // update last fetched post
      if (options == null || !options.hasOwnProperty("test") || !options.test ) {
        lastPost = posts[0];
        persistObj(DB_LAST_POST, lastPost, function(err, data) {});
      } else {
        persistentLog(LOG_VERBOSE, "didn't set lastpost, this is a test run");
      }
      // finish
      persistentLog(LOG_GENERAL, " - num remaining posts: "+posts.length);
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 1, get owner metrics
    function () {
      persistentLog(LOG_GENERAL, "metrics generation 1: owner metrics...");
      var deferred = Q.defer();
      // get this user's votes
      persistentLog(LOG_VERBOSE, " - count this user's votes today");
      steem.api.getAccountVotes(process.env.STEEM_USER, function(err, votes) {
        var num_votes_today = 0;
        if (err) {
          persistentLog(LOG_GENERAL, " - error, can't get "+process.env.STEEM_USER+" votes: "+err.message);
        } else {
          for (var i = 0 ; i < votes.length ; i++) {
            if ((timeNow - getEpochMillis(votes[i].time)) < (1000 * 60 * 60 * 24)) {
              num_votes_today++;
            }
          }
        }
        // finish
        owner.num_votes_today = num_votes_today;
        persistentLog(LOG_VERBOSE, " - num_votes_today: "+num_votes_today);
        deferred.resolve(num_votes_today > 0);
      });
      return deferred.promise;
    },
    // transform post data to metrics 2, basic post metrics
    function () {
      persistentLog(LOG_GENERAL, "metrics generation 2, basic post metrics...");
      var deferred = Q.defer();
      // create metrics for posts
      postsMetrics = [];
      var fetchUsers = [];
      for (var i = 0 ; i < posts.length ; i++) {
        persistentLog(LOG_VERBOSE, " - post ["+posts[i].permlink+"]");
        var metric = {};
        // post_alive_time: Time since post, in minutes
        var postTimeStamp = getEpochMillis(posts[i].created);
        var alive_time = 0;
        if (postTimeStamp != 0) {
          alive_time = (timeNow - postTimeStamp) / (1000 * 60);
        }
        metric.post_alive_time = alive_time;
        persistentLog(LOG_VERBOSE, " - - metrics.post.alive_time: "+metric.post_alive_time);
        //post_est_payout: Estimated payout
        metric.post_est_payout = parseFloat(posts[i].total_pending_payout_value);
        persistentLog(LOG_VERBOSE, " - - metrics.post.est_payout: "+metric.post_est_payout);
        //post_num_upvotes: Number of up votes (normal votes for a post)
        //post_num_downvotes: Number of flags / downvotes
        posts[i].up_votes = [];
        posts[i].down_votes = [];
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          if (posts[i].active_votes[j].percent < 0) {
            posts[i].down_votes.push(posts[i].active_votes[j]);
          } else {
            posts[i].up_votes.push(posts[i].active_votes[j]);
          }
        }
        metric.post_num_upvotes = posts[i].up_votes.length;
        metric.post_num_downvotes = posts[i].down_votes.length;
        persistentLog(LOG_VERBOSE, " - - metrics.post.post_num_upvotes: "+metric.post_num_upvotes);
        persistentLog(LOG_VERBOSE, " - - metrics.post.post_num_downvotes: "+metric.post_num_downvotes);
        // add author and voters to user fetch list
        fetchUsers.push(posts[i].author);
        for (var j = 0 ; j < posts[i].active_votes.length ; j++) {
          //persistentLog(LOG_VERBOSE, " - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
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
            persistentLog(LOG_GENERAL, " - error, can't get "+voter+" votes: "+err.message);
          } else {
            for (var k = 0 ; k < userAccounts.length ; k++) {
              users[userAccounts[k].name] = userAccounts[k];
            }
          }
          // finish
          persistentLog(LOG_VERBOSE, " - - finished getting voters for post");
          deferred.resolve(true);
        });
      } else {
        // finish
        persistentLog(LOG_VERBOSE, " - - no voters account information to get for post");
        deferred.resolve(true);
      }
      // return promise
      return deferred.promise;
    },
    // transform post data to metrics 3, analyse votes
    function () {
      persistentLog(LOG_GENERAL, "metrics generation 3, analyse votes...");
      var deferred = Q.defer();
      if (!algorithmUsesVotingAnalysis) {
        persistentLog(LOG_GENERAL, " - SKIPPING metrics 3 (voting), not required by algorithm");
        // finish
        deferred.resolve(true);
        return deferred.promise;
      }
      // analyse votes for posts
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(LOG_VERBOSE, " - postsMetrics ["+i+"]");
        // *** VOTES IN DETAIL
        // note, should do this last, has complex nesting that we need to use Q to sort out
        //persistentLog(LOG_VERBOSE, " - - * VOTES IN DETAIL");
        // up votes
        postsMetrics[i].post_up_voted_num_dolphin = 0;
        postsMetrics[i].post_up_voted_num_whale = 0;
        postsMetrics[i].post_up_voted_num_followed = 0;
        postsMetrics[i].post_up_voted_num_whitelisted = 0;
        postsMetrics[i].post_up_voted_num_blacklisted = 0;
        for (var j = 0 ; j < posts[i].up_votes.length ; j++) {
          //persistentLog(LOG_VERBOSE, " - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].up_votes[j].voter;
          if (voter.localeCompare(process.env.STEEM_USER) != 0
              && users[voter]) {
            var voterAccount = users[voter];
            // determine if dolphin or whale, count
            var steemPower = getSteemPowerFromVest(voterAccount.vesting_shares);
            if (steemPower >= configVars.CAPITAL_WHALE_MIN) {
              postsMetrics[i].post_up_voted_num_whale++;
            } else if (steemPower >= configVars.CAPITAL_DOLPHIN_MIN) {
              postsMetrics[i].post_up_voted_num_dolphin++;
            }
            // determine if followed, count
            for (var k = 0 ; k < following.length ; k++) {
              if (following[k] && following[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_up_voted_num_followed++;
              }
            }
            // determine if white / blacklisted, count
            for (var k = 0 ; k < algorithm.authorWhitelist.length ; k++) {
              if (algorithm.authorWhitelist[k] && algorithm.authorWhitelist[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_up_voted_num_whitelisted++;
              }
            }
            for (var k = 0 ; k < algorithm.authorBlacklist.length ; k++) {
              if (algorithm.authorBlacklist[k] && algorithm.authorBlacklist[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_up_voted_num_blacklisted++;
              }
            }
          }
        }
        // boolean
        postsMetrics[i].post_up_voted_any_dolphin = (postsMetrics[i].post_up_voted_num_dolphin > 0) ? 1 : 0;
        postsMetrics[i].post_up_voted_any_whale = (postsMetrics[i].post_up_voted_num_whale > 0) ? 1 : 0;
        postsMetrics[i].post_up_voted_any_followed = (postsMetrics[i].post_up_voted_num_followed > 0) ? 1 : 0;
        postsMetrics[i].post_up_voted_any_whitelisted = (postsMetrics[i].post_up_voted_num_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_up_voted_any_blacklisted = (postsMetrics[i].post_up_voted_num_blacklisted > 0) ? 1 : 0;
        // down votes
        postsMetrics[i].post_down_voted_num_dolphin = 0;
        postsMetrics[i].post_down_voted_num_whale = 0;
        postsMetrics[i].post_down_voted_num_followed = 0;
        postsMetrics[i].post_down_voted_num_whitelisted = 0;
        postsMetrics[i].post_down_voted_num_blacklisted = 0;
        for (var j = 0 ; j < posts[i].down_votes.length ; j++) {
          //persistentLog(LOG_VERBOSE, " - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].down_votes[j].voter;
          if (voter.localeCompare(process.env.STEEM_USER) != 0
            && users[voter]) {
            var voterAccount = users[voter];
            // determine if dolphin or whale, count
            var steemPower = getSteemPowerFromVest(voterAccount.vesting_shares);
            if (steemPower >= configVars.CAPITAL_WHALE_MIN) {
              postsMetrics[i].post_down_voted_num_whale++;
            } else if (steemPower >= configVars.CAPITAL_DOLPHIN_MIN) {
              postsMetrics[i].post_down_voted_num_dolphin++;
            }
            // determine if followed, count
            for (var k = 0 ; k < following.length ; k++) {
              if (following[k] && following[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_down_voted_num_followed++;
              }
            }
            // determine if white / blacklisted, count
            for (var k = 0 ; k < algorithm.authorWhitelist.length ; k++) {
              if (algorithm.authorWhitelist[k] && algorithm.authorWhitelist[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_down_voted_num_whitelisted++;
              }
            }
            for (var k = 0 ; k < algorithm.authorBlacklist.length ; k++) {
              if (algorithm.authorBlacklist[k] && algorithm.authorBlacklist[k].localeCompare(voter) == 0) {
                postsMetrics[i].post_down_voted_num_blacklisted++;
              }
            }
          }
        }
        // boolean
        postsMetrics[i].post_down_voted_any_dolphin = (postsMetrics[i].post_down_voted_num_dolphin > 0) ? 1 : 0;
        postsMetrics[i].post_down_voted_any_whale = (postsMetrics[i].post_down_voted_num_whale > 0) ? 1 : 0;
        postsMetrics[i].post_down_voted_any_followed = (postsMetrics[i].post_down_voted_num_followed > 0) ? 1 : 0;
        postsMetrics[i].post_down_voted_any_whitelisted = (postsMetrics[i].post_down_voted_num_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_down_voted_any_blacklisted = (postsMetrics[i].post_down_voted_num_blacklisted > 0) ? 1 : 0;
      }
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // transform post data to metrics 4, post author metrics
    function () {
      persistentLog(LOG_GENERAL, "metrics generation 4, post author metrics...");
      var deferred = Q.defer();
      if (!algorithmUsesAuthorAnalysis) {
        persistentLog(LOG_GENERAL, " - SKIPPING metrics 4 (author), not required by algorithm");
        // finish
        deferred.resolve(true);
        return deferred.promise;
      }
      // process
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(LOG_VERBOSE, " - postsMetrics ["+i+"]");
        // check we have author account, we should
        if (users[posts[i].author]) {
          // get capital value
          var steemPower = getSteemPowerFromVest(users[posts[i].author].vesting_shares);
          //metrics.author.capital_val: Capital (Steem Power) by value
          postsMetrics[i].author_capital_val = steemPower;
          if (steemPower >= configVars.CAPITAL_WHALE_MIN) {
            postsMetrics[i].author_is_minnow = 0;
            postsMetrics[i].author_is_dolphin = 0;
            postsMetrics[i].author_is_whale = 1;
          } else if (steemPower >= configVars.CAPITAL_DOLPHIN_MIN) {
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
          for (var k = 0 ; k < algorithm.authorWhitelist.length ; k++) {
            if (algorithm.authorWhitelist[k] && algorithm.authorWhitelist[k].localeCompare(posts[i].author) == 0) {
              postsMetrics[i].author_is_whitelisted = 1;
              break;
            }
          }
          postsMetrics[i].author_is_blacklisted = 0;
          for (var k = 0 ; k < algorithm.authorBlacklist.length ; k++) {
            if (algorithm.authorBlacklist[k] && algorithm.authorBlacklist[k].localeCompare(posts[i].author) == 0) {
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
      persistentLog(LOG_VERBOSE, "metrics generation 5, do NLP processing");
      var deferred = Q.defer();
      postsNlp = [];
      if (!algorithmUsesNlpListsLinksLangAnalysis) {
        persistentLog(LOG_VERBOSE, " - SKIPPING metrics 5 (NLP/lists/links/language), not required by algorithm");
        // finish
        deferred.resolve(true);
        return deferred.promise;
      }
      var postCount = 0;
      for (var i = 0 ; i < posts.length ; i++) {
        persistentLog(LOG_VERBOSE, " - post ["+posts[i].permlink+"]");
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
        persistentLog(LOG_VERBOSE, " - - nlp.content (length): "+nlp.content.length);
        // get keywords from alphanumberic only, and in lower case to stop different case duplicates
        var alphaNumericContent = nlp.content.replace(alphanumOnlyRegex," ").toLowerCase();
        //persistentLog(LOG_VERBOSE, " - - - alphaNumericContent: "+alphaNumericContent);
        var glossary = Glossary({minFreq: configVars.MIN_KEYWORD_FREQ, collapse: true, blacklist: glossaryBlacklist});
        var keywords = glossary.extract(alphaNumericContent);
        // remove keywords less than MIN_KEYWORD_LEN letters long
        nlp.keywords = [];
        var removedCount = 0;
        for (var j = 0 ; j < keywords.length ; j++) {
          if (keywords[j].length >= configVars.MIN_KEYWORD_LEN) {
            nlp.keywords.push(keywords[j]);
          } else {
            removedCount++;
          }
        }
        persistentLog(LOG_VERBOSE, " - - nlp.keywords: "+nlp.keywords);
        //persistentLog(LOG_VERBOSE, " - - - removed "+removedCount+" short keywords");
        // get all url links
        nlp.urls = [];
        var urlResult;
        while((urlResult = urlRegex.exec(posts[i].body)) !== null) {
          nlp.urls.push(urlResult[0]);
        }
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
                persistentLog(LOG_VERBOSE, " - - - sentiment extraction error: "+err.message);
              }
              //persistentLog(LOG_VERBOSE, " - - nlp.sentiment: "+nlp.sentiment);
              postsNlp.push(nlp);
              // count words using tree, i.e. count WordNode instances
              nlp.num_words = countWordsFromRetext(tree);
              //persistentLog(LOG_VERBOSE, " - - nlp.num_words: "+nlp.num_words);
              // commit to postsNlp
              persistentLog(LOG_VERBOSE, " - - nlp done on post");
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
      persistentLog(LOG_GENERAL, "metrics generation 6, calc cultural metrics, content - textpost...");
      var deferred = Q.defer();
      if (!algorithmUsesNlpListsLinksLangAnalysis) {
        persistentLog(LOG_GENERAL, " - SKIPPING metrics 6 (NLP/lists/links/language), not required by algorithm");
        // finish
        deferred.resolve(true);
        return deferred.promise;
      }
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(LOG_VERBOSE, " - postsMetrics ["+i+"]");
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
              //persistentLog(LOG_VERBOSE, " - - checking tags: "+metadata.tags);
              for (var j = 0 ; j < metadata.tags.length ; j++) {
                var tag = metadata.tags[j];
                postsMetrics[i].post_num_tags_whitelisted += (algorithm.contentCategoryWhitelist.indexOf(tag) >= 0) ? 1 : 0;
                postsMetrics[i].post_num_tags_blacklisted += (algorithm.contentCategoryBlacklist.indexOf(tag) >= 0) ? 1 : 0;
              }
            } else {
              persistentLog(LOG_VERBOSE, " - - no tags to check");
            }
          } catch(err) {
            persistentLog(LOG_VERBOSE, " - - no tags to check, err: "+err.message);
          }
        } else {
          persistentLog(LOG_VERBOSE, " - - no tags to check");
        }
        postsMetrics[i].post_num_keywords_whitelisted = 0;
        postsMetrics[i].post_num_keywords_blacklisted = 0;
        postsMetrics[i].post_num_words_whitelisted = 0;
        postsMetrics[i].post_num_words_blacklisted = 0;
        //persistentLog(LOG_VERBOSE, " - - checking keywords");
        for (var j = 0 ; j < nlp.keywords.length ; j++) {
          var keyword = nlp.keywords[j];
          postsMetrics[i].post_num_keywords_whitelisted += (algorithm.contentWordWhitelist.indexOf(keyword) >= 0) ? 1 : 0;
          postsMetrics[i].post_num_keywords_blacklisted += (algorithm.contentWordBlacklist.indexOf(keyword) >= 0) ? 1 : 0;
          postsMetrics[i].post_num_words_whitelisted += (nlp.content.indexOf(keyword) >= 0) ? 1 : 0;
          postsMetrics[i].post_num_words_blacklisted += (nlp.content.indexOf(keyword) >= 0) ? 1 : 0;
        }
        // - bool
        postsMetrics[i].post_category_whitelisted = (algorithm.contentCategoryWhitelist.indexOf(posts[i].category) >= 0) ? 1 : 0;
        postsMetrics[i].post_category_blacklisted = (algorithm.contentCategoryBlacklist.indexOf(posts[i].category) >= 0) ? 1 : 0;
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
        //persistentLog(LOG_VERBOSE, " - - classifying urls");
        for (var j = 0 ; j < nlp.urls.length ; j++) {
          var url = nlp.urls[j];
          postsMetrics[i].post_num_links_total++;
          //persistentLog(LOG_VERBOSE, " - - - url: "+url);
          // get domain
          var domain = "";
          var urlParts = S(url).splitLeft("//", 1);
          if (urlParts && urlParts.length > 1) {
            var urlSubParts = S(urlParts[1]).splitLeft("/", 1);
            if (urlSubParts && urlSubParts.length >= 1) {
              var domainParts = S(urlSubParts[0]).splitLeft(".");
              if (domainParts.length > 2) {
                domain = domainParts[1];
              } else if (domainParts.length > 0) {
                domain = domainParts[0];
              } // else failed, leave domain blank
            }
          }
          //persistentLog(LOG_VERBOSE, " - - - domain: "+domain);
          // track matching progress
          var match = false;
          // check if is image
          for (var k = 0 ; k < imagesExt.length ; k++) {
            if (S(url).endsWith("."+imagesExt[k])) {
              postsMetrics[i].post_num_links_image++;
              //persistentLog(LOG_VERBOSE, " - - - - is image");
              match = true;
              break;
            }
          }
          // check if is video link
          if (!match) {
            if (videoDomains.indexOf(domain) >= 0) {
              postsMetrics[i].post_num_links_video++;
              //persistentLog(LOG_VERBOSE, " - - - - is video");
              match = true;
            }
          }
          // if not image or video, assume is normal webpage
          if (!match) {
            postsMetrics[i].post_num_links_page++;
          }
          // check for domain presence on white / black list
          postsMetrics[i].post_num_link_domains_whitelisted += (algorithm.domainWhitelist.indexOf(domain) >= 0) ? 1 : 0;
          postsMetrics[i].post_num_link_domains_blacklisted += (algorithm.domainBlacklist.indexOf(domain) >= 0) ? 1 : 0;
          // Content - complex, using more than one other metric to create a metric
          postsMetrics[i].post_very_short = 0;
          postsMetrics[i].post_images_only = 0;
          postsMetrics[i].post_videos_only = 0;
          postsMetrics[i].post_mixed_links_only = 0;
          if (postsMetrics[i].post_num_words < configVars.MIN_WORDS_FOR_ARTICLE) {
            postsMetrics[i].post_very_short = 1;
            if (postsMetrics[i].post_num_links_image > 0
                && postsMetrics[i].post_num_links_image > postsMetrics[i].post_num_links_video
                && postsMetrics[i].post_num_links_image > postsMetrics[i].post_num_links_page) {
              postsMetrics[i].post_images_only = 1;
            } else if (postsMetrics[i].post_num_links_video > 0
                && postsMetrics[i].post_num_links_video > postsMetrics[i].post_num_links_image
                && postsMetrics[i].post_num_links_video > postsMetrics[i].post_num_links_page) {
              postsMetrics[i].post_videos_only = 1;
            } else if (postsMetrics[i].post_num_links_page > 0) {
              postsMetrics[i].post_mixed_links_only = 1;
            }
          }
        }
        postsMetrics[i].post_any_link_domains_whitelisted = (postsMetrics[i].post_num_link_domains_whitelisted > 0) ? 1 : 0;
        postsMetrics[i].post_any_link_domains_blacklisted = (postsMetrics[i].post_num_link_domains_blacklisted > 0) ? 1 : 0;
        // author metrics
        postsMetrics[i].author_repuation = steem.formatter.reputation(posts[i].author_reputation);
        // get language usage
        postsMetrics[i].post_has_english_language_use = 0;
        postsMetrics[i].post_has_german_language_use = 0;
        postsMetrics[i].post_has_spanish_language_use = 0;
        postsMetrics[i].post_has_french_language_use = 0;
        var detectedLanguages = langDetector.detect(posts[i].body);
        persistentLog(LOG_VERBOSE, " - language detect for ["+posts[i].permlink+"] :"+detectedLanguages);
        if (detectedLanguages.length > 0 && detectedLanguages[0][1] > configVars.MIN_LANGUAGE_USAGE_PC) {
          var language = detectedLanguages[0][0];
          if (language.localeCompare('english') == 0) {
            postsMetrics[i].post_has_english_language_use = 1;
            persistentLog(LOG_VERBOSE, " - - post is in English");
          } else if (language.localeCompare('german') == 0) {
            postsMetrics[i].post_has_german_language_use = 1;
            persistentLog(LOG_VERBOSE, " - - post is in German");
          } else if (language.localeCompare('spanish') == 0) {
            postsMetrics[i].post_has_spanish_language_use = 1;
            persistentLog(LOG_VERBOSE, " - - post is in Spanish");
          } else if (language.localeCompare('french') == 0) {
            postsMetrics[i].post_has_french_language_use = 1;
            persistentLog(LOG_VERBOSE, " - - post is in French");
          }
        }
      }
      // finish
      persistentLog(LOG_GENERAL, "*** finished gathering metrics");
      //persistentLog(LOG_VERBOSE, " - postsMetrics array: "+JSON.stringify(postsMetrics));
      deferred.resolve(true);
      return deferred.promise;
    },
    // calculate scores for each post
    function () {
      persistentLog(LOG_GENERAL, "calculate scores for each post...");
      var deferred = Q.defer();
      // calculate scores
      postsMetadata = [];
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(LOG_VERBOSE, " - - post "+i);
        var metric = postsMetrics[i];
        var scoreDetail = {
          total: 0,
          metrics: []
        };
        for (var j = 0 ; j < algorithm.weights.length ; j++) {
          if (metric.hasOwnProperty(algorithm.weights[j].key)) {
            var value = metric[algorithm.weights[j].key];
            var weight = algorithm.weights[j].value;
            if (algorithm.weights[j].hasOwnProperty("lower")) { //must at least have lower defined, upper is optional
              var lower = 0;
              var upper = Number.MAX_VALUE;
              if (algorithm.weights[j].hasOwnProperty("lower")) {
                lower = algorithm.weights[j].lower;
              }
              if (algorithm.weights[j].hasOwnProperty("upper")) {
                upper = algorithm.weights[j].upper;
              }
              //persistentLog(LOG_VERBOSE, " - - - - - bounding metric("+value+") for range "+lower+" to "+upper);
              if (value < lower) {
                value = 0;
              } else if (value > upper) {
                value = (upper - lower);
                if (value > 0 && lower > 0) {
                  value++;
                }
              } else {
                value = (value - lower);
                if (value > 0 && lower > 0) {
                  value++;
                }
              }
              //persistentLog(LOG_VERBOSE, " - - - - - after bounding: "+value);
            }
            var metricScore = {
              key: algorithm.weights[j].key,
              value: value,
              weight: weight,
              score: (value * weight)
            };
            scoreDetail.total += metricScore.score;
            scoreDetail.metrics.push(metricScore);
            persistentLog(LOG_VERBOSE, " - - - - "+algorithm.weights[j].key+": "+value+" * weight("+weight+") = "+metricScore.score);
          } else {
            persistentLog(LOG_VERBOSE, " - - - - error, key not found in metrics: "+weight);
          }
        }
        persistentLog(LOG_VERBOSE, " - - FINAL SCORE: "+scoreDetail.total);
        postsMetadata.push(
          {
            title: posts[i].title,
            url: "https://steemit.com"+posts[i].url,
            author: posts[i].author,
            time: posts[i].created,
            cur_est_payout: postsMetrics[i].post_est_payout,
            upvotes: postsMetrics[i].post_num_upvotes,
            downvotes: postsMetrics[i].post_num_downvotes,
            alive_time: postsMetrics[i].post_alive_time,
            score: scoreDetail.total,
            scoreDetail: scoreDetail,
            permlink: posts[i].permlink,
            vote: false //may be set to true in next process
          });
      }
      deferred.resolve(true);
      return deferred.promise;
    },
    // choose posts to vote on based on scores
    function () {
      persistentLog(LOG_GENERAL, "choose posts to vote on based on" +
        " scores and vote...");
      var deferred = Q.defer();
      wait.launchFiber(function() {
        var upVotesProcessed = 0;
        var isFirst = true;
        var avgWindowInfo_copy = clone(avgWindowInfo);
        // perform check, if this is the first time the bot is run, make the threshold window out of the first
        //    NUM_POSTS_FOR_AVG_WINDOW number of posts, or less if not that many are equal to or above MIN_SCORE_THRESHOLD
        if (avgWindowInfo.postScores.length == 0) {
          persistentLog(LOG_VERBOSE, " - first bot run, looking ahead to create scores window");
          var count = 0;
          for (var i = 0; i < posts.length; i++) {
            if (postsMetadata[i].score >= configVars.MIN_SCORE_THRESHOLD) {
              avgWindowInfo.postScores.push(postsMetadata[i].score);
              if (count++ >= configVars.NUM_POSTS_FOR_AVG_WINDOW) {
                break;
              }
            }
          }
          persistentLog(LOG_VERBOSE, " - created window from " + count + " scores");
        }
        for (var i = 0; i < posts.length; i++) {
          var thresholdInfo = {
            min: configVars.MIN_SCORE_THRESHOLD
          };
          // add this score first, if meets minimum
          if (postsMetadata[i].score >= configVars.MIN_SCORE_THRESHOLD) {
            avgWindowInfo.postScores.push(postsMetadata[i].score);
          }
          // recalculate avgerage based on window value
          persistentLog(LOG_VERBOSE, " - - recalculating score threshold with window:" + JSON.stringify(avgWindowInfo.postScores));
          // calculate average
          var avg = 0;
          var maxScore = configVars.MIN_SCORE_THRESHOLD;
          var count = 0;
          for (var j = 0; j < avgWindowInfo.postScores.length; j++) {
            if (avgWindowInfo.postScores[j] > configVars.MIN_SCORE_THRESHOLD) {
              avg += avgWindowInfo.postScores[j];
              count++;
              if (avgWindowInfo.postScores[j] > maxScore) {
                maxScore = avgWindowInfo.postScores[j];
              }
            }
          }
          if (count > 0) {
            avg /= count;
          }
          thresholdInfo.average = avg;
          // calculate variance
          var variance = 0;
          for (var j = 0; j < avgWindowInfo.postScores.length; j++) {
            if (avgWindowInfo.postScores[j] > configVars.MIN_SCORE_THRESHOLD) {
              variance += Math.pow(avgWindowInfo.postScores[j] - avg, 2);
            }
          }
          if (count > 0) {
            variance /= count;
          }
          thresholdInfo.variance = variance;
          // calculate threshold
          var threshold = avg;
          if (threshold < configVars.MIN_SCORE_THRESHOLD) {
            threshold = configVars.MIN_SCORE_THRESHOLD;
            // stats
            thresholdInfo.percentInc = 0;
            thresholdInfo.total = threshold;
          } else {
            // first apply percentage increase on threshold,
            //   i.e. must be SCORE_THRESHOLD_INC_PC % better than average to be selected
            // #74, as of this ticket, use as percentage of variance, but cannot exceed same
            //    percentage of threshold (average)
            thresholdInfo.percentInc = variance * configVars.SCORE_THRESHOLD_INC_PC;
            if (thresholdInfo.percentInc > (threshold * configVars.SCORE_THRESHOLD_INC_PC)) {
              thresholdInfo.percentInc = threshold * configVars.SCORE_THRESHOLD_INC_PC;
            }
            threshold += thresholdInfo.percentInc;
            // #90, removed thresholdInfo.voteAdjustmentInc completely as
            //   is now obsolete due to removal of MAX_VOTES_IN_24_HOURS
            // #7 : add vote throttling based on voting power closeness
            //   to minimum
            var vpDiffFrom100 = (100 - (owner.voting_power / 100));
            if (vpDiffFrom100 > 0) {
              thresholdInfo.voteAdjustmentInc = (maxScore - threshold)
                * (vpDiffFrom100 / (100 - configVars.MIN_VOTING_POWER));
              if (thresholdInfo.voteAdjustmentInc < 0) {
                thresholdInfo.voteAdjustmentInc = 0;
              }
              threshold += thresholdInfo.voteAdjustmentInc;
            } // else nothing to add

            thresholdInfo.total = threshold;
            if (thresholdInfo.total < configVars.MIN_SCORE_THRESHOLD) {
              thresholdInfo.total = configVars.MIN_SCORE_THRESHOLD;
            }
          }
          avgWindowInfo.scoreThreshold = thresholdInfo.total;
          postsMetadata[i].thresholdInfo = thresholdInfo;
          persistentLog(LOG_VERBOSE, " - - - new avg / score threshold: " + avgWindowInfo.scoreThreshold);
          persistentLog(LOG_VERBOSE, " - - - - new threshold info: " + JSON.stringify(thresholdInfo));
          // prune scores in window list to keep at NUM_POSTS_FOR_AVG_WINDOW size
          if ((avgWindowInfo.postScores.length - configVars.NUM_POSTS_FOR_AVG_WINDOW) >= 0) {
            var newScoresWindow = [];
            for (var j = avgWindowInfo.postScores.length - configVars.NUM_POSTS_FOR_AVG_WINDOW; j < avgWindowInfo.postScores.length; j++) {
              newScoresWindow.push(avgWindowInfo.postScores[j]);
            }
            avgWindowInfo.postScores = newScoresWindow;
          }

          // check if post score is above threshold, set to vote if is
          postsMetadata[i].vote = false;
          if (postsMetadata[i].score >= avgWindowInfo.scoreThreshold) {
            // #7 first check if we have voting power
            var percentageVp = owner.voting_power / 100;
            persistentLog(LOG_VERBOSE, " - - - checking if enough" +
              " voting power" +
              " (" + percentageVp + " >= " + configVars.MIN_VOTING_POWER + ") ?");
            if (percentageVp >= configVars.MIN_VOTING_POWER) {
              // housekeeping
              persistentLog(LOG_VERBOSE, " - - " + postsMetadata[i].score + " >= " + avgWindowInfo.scoreThreshold + ", WILL vote on post [" + posts[i].permlink + "]");
              postsMetadata[i].vote = true;
              upVotesProcessed++;
              addDailyLikedPost(postsMetadata[i], isFirst);
              isFirst = false;
              // #7 now voting here
              if (options == null || !options.hasOwnProperty("test") || !options.test) {
                // vote!
                try {
                  var upvoteResult = wait.for(steem.broadcast.vote, process.env.POSTING_KEY_PRV,
                    process.env.STEEM_USER, postsMetadata[i].author,
                    postsMetadata[i].permlink, parseInt(configVars.VOTE_VOTING_POWER * 100));
                  persistentLog(LOG_GENERAL, " - - - - upvoted with result: " + JSON.stringify(upvoteResult));
                } catch (err) {
                  persistentLog(LOG_GENERAL, " - - - - ERROR voting on post: " + postsMetadata[i].permlink);
                }
                persistentLog(LOG_GENERAL, " - - - - voted on " + upVotesProcessed + " posts");
                // wait 5 seconds
                persistentLog(LOG_GENERAL, " - - - waiting 3 seconds...");
                var timeOutWrapper = function (delay, func) {
                  setTimeout(function () {
                    func(null, true);
                  }, delay);
                };
                wait.for(timeOutWrapper, 5000);
                persistentLog(LOG_VERBOSE, " - - - finished waiting");
              } else {
                persistentLog(LOG_VERBOSE, " - - - would have voted, but running in test mode");
              }
              // update accounts _after_ attempting vote
              var account = wait.for(steem_getAccounts_wrapper)[0];
              // don't do regeneration, will be up to date
              owner.voting_power = account.voting_power;
              persistentLog(LOG_VERBOSE, " - - - update voting power to "+owner.voting_power);
            } else {
              persistentLog(LOG_GENERAL, " - - - - NOT voting on " + postsMetadata[i].permlink + ", VP is " + percentageVp);
            }
          } else {
            persistentLog(LOG_VERBOSE, " - - " + postsMetadata[i].score + " < " + avgWindowInfo.scoreThreshold + ", WILL NOT vote on post [" + posts[i].permlink + "]");
          }

        }
        // restore avgWindowInfo
        if (options != null && options.test) {
          avgWindowInfo = avgWindowInfo_copy;
        }
        // save updated avgWindowInfo
        persistentLog(LOG_VERBOSE, " - saving avg_window_info");
        persistObj(DB_AVG_WINDOW_INFO, avgWindowInfo, function (err) {
          if (err) {
            persistentLog(LOG_GENERAL, " - - ERROR SAVING avg_window_info");
          }
        });
        // finish
        deferred.resolve(true);
      });
      return deferred.promise;
    },
    // return http after casting votes
    function () {
      persistentLog(LOG_GENERAL, "save posts metadata to db...");
      var deferred = Q.defer();
      // and save postsMetadata to persistent
      if (options === undefined || !options.hasOwnProperty("test") || !options.test ) {
        persistentLog(LOG_VERBOSE, " - saving posts_metadata");
        savePostsMetadata(function (res) {
          persistentLog(LOG_VERBOSE, " - - SAVED posts_metadata: " + res.message);
          // finish
          deferred.resolve(true);
        });
      } else {
        persistentLog(LOG_GENERAL, " - - NOT saving postsmetadata, this is a test run");
        // finish
        deferred.resolve(true);
      }
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
      persistentLog(LOG_GENERAL, "runBot finished successfully!");
      if (callback !== undefined && callback !== null) {
        setTimeout(function () {
          callback(postsMetadata);
        }, 10000);
      }
    }
  })
  .catch(function (err) {
    console.error(err);
    if (callback !== undefined && callback !== null) {
      setTimeout(function () {
        callback(postsMetadata);
      }, 10000);
    }
  });
}

function steem_getAccounts_wrapper(callback) {
  steem.api.getAccounts([process.env.STEEM_USER], function(err, result) {
    callback(err, result);
  });
}

function stringListToLowerCase(strList) {
  if (strList == null || strList.length < 1) {
    return [];
  }
  for (var i = 0 ; i < strList.length ; i++) {
    strList[i] = strList[i].toLowerCase();
  }
  return strList;
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

function addDailyLikedPost(postsMetadataObj, isFirst) {
  persistentLog(LOG_VERBOSE, "addDailyLikedPost for ["+postsMetadataObj.permlink+"]");
  var nowDate = moment_tz.tz((new Date()).getTime(), configVars.TIME_ZONE);
  var dateStr = nowDate.format("MM-DD-YYYY");
  var createNew = true;
  db.collection(DB_DAILY_LIKED_POSTS).find({}).toArray(function(err, dailyLikedPosts) {
    if (err || dailyLikedPosts === null && dailyLikedPosts.length === 0 || dailyLikedPosts[0] === null) {
      persistentLog(LOG_GENERAL, " - failed to save daily liked post");
    } else {
      // clean old posts
      var limitDate = nowDate.clone();
      limitDate.subtract(configVars.DAYS_KEEP_LOGS, 'days');
      var numRemoved = 0;
      for (var i = 0 ; i < dailyLikedPosts.length ; i++) {
        var date = moment(dailyLikedPosts[i].date_str, "MM-DD-YYYY");
        if (date.isBefore(limitDate)) {
          // remove
          db.collection(DB_DAILY_LIKED_POSTS).remove(dailyLikedPosts[i], function (err, data) {
            if (err) {
              persistentLog(LOG_GENERAL, " - - failed to remove old" +
                " daily liked post");
            }
          });
          numRemoved++;
        }
      }
      persistentLog(LOG_VERBOSE, " - removed "+numRemoved+" old daily" +
        " liked posts");
      // try to find match to add this daily voted post to
      for (var i = 0 ; i < dailyLikedPosts.length ; i++) {
        if (dailyLikedPosts[i].date_str.localeCompare(dateStr) === 0) {
          dailyLikedPosts[i].posts.push(postsMetadataObj);
          if (isFirst) {
            dailyLikedPosts[i].runs = dailyLikedPosts[i].runs + 1;
          }
          persistentLog(LOG_VERBOSE, " - match on existing date: "+dateStr+", adding to that");
          createNew = false;
          db.collection(DB_DAILY_LIKED_POSTS).save(dailyLikedPosts[i], function (err, data) {
            if (err) {
              persistentLog(LOG_GENERAL, " - - error saving daily liked" +
                " post");
            } else {
              persistentLog(LOG_VERBOSE, " - - saved daily liked post");
            }
          });
          break;
        }
      }
      if (createNew) {
        // add new date object with this post
        persistentLog(LOG_VERBOSE, " - creating new date: "+dateStr);
        db.collection(DB_DAILY_LIKED_POSTS).save(
          {
            date_str: dateStr,
            posts: [
              postsMetadataObj
            ],
            runs: 1
          },
          function (err, data) {
            if (err) {
              persistentLog(LOG_GENERAL, " - - error saving new daily" +
                " liked post");
            } else {
              persistentLog(LOG_VERBOSE, " - - saved new daily liked post");
            }
        });
      }
    }
  });
}

function getDailyLikedPosts(date_str, callback) {
  persistentLog(LOG_VERBOSE, " - getDailyLikedPosts, for date_str = "+date_str);
  var query = {};
  if (date_str !== undefined && date_str !== null) {
    query = {"date_str": date_str};
  }
  db.collection(DB_DAILY_LIKED_POSTS).find(query).toArray(function(err, data) {
    if (err || data === undefined || data === null || data.length === 0 || data[0] === undefined || data[0] === null) {
      persistentLog(LOG_GENERAL, " - failed to get daily liked post");
      callback(err);
    } else {
      if (date_str !== undefined && date_str !== null) {
        callback(null, data[0]);
      } else {
        callback(null, data);
      }
    }
  });
}


/*
* Steem access
*/

/*
initSteem():
* Initialize steem, test API connection and get minimal required data
*/
function initLib(initSteem, callback) {
  setupLogging();
  // #93, use alternate websocket temporarily
  steem.api.setOptions({ url: 'https://api.steemit.com'});
  // #71, no longer need to set this
  var processes = [
    function() {
      var deferred = Q.defer();
      startDb(function(err) {
        if (err) {
          throw err;
        } else {
          deferred.resolve(true);
        }
      });
      return deferred.promise;
    },
    function() {
      var deferred = Q.defer();
      testEnvVars(function(err) {
        if (err) {
          throw err;
        } else {
          deferred.resolve(true);
        }
      });
      return deferred.promise;
    },
    function() {
      var deferred = Q.defer();
      if (initSteem) {
        getUserAccount(function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve(true);
          }
        });
      } else {
        deferred.resolve(true);
      }
      return deferred.promise;
    },
    function() {
      var deferred = Q.defer();
      // get last post
      getPersistentObj(DB_LAST_POST, function(err, post) {
        if (err) {
          console.log("no last post, probably this is first run for server");
          throw err;
        } else {
          if (lastPost !== undefined && lastPost !== null) {
            lastPost = post;
            console.log("got last post, id: "+lastPost.id);
          } else {
            console.log("no last post recorded yet");
          }
          deferred.resolve(true);
        }
      });
      return deferred.promise;
    },
    function() {
      var deferred = Q.defer();
      getPersistentObj(DB_CONFIG_VARS, function(err, configVarsResult) {
        if (err || configVarsResult === undefined || configVarsResult === null) {
          console.log("no config vars set yet, using default");
        } else {
          console.log("got config vars from db");
          configVars = configVarsResult;
        }
        deferred.resolve(true);
      });
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
        callback(true);
      } else {
        callback(false);
      }
    })
    .catch(function (err) {
      console.error(err);
      callback(false);
    });
}

/*
getUserAccount():
*/
function getUserAccount(callback) {
  if (process.env.STEEM_USER) {
    steem.api.getAccounts([process.env.STEEM_USER], function(err, result) {
      console.log(err, result);
      if (err || result.length < 1) {
        console.error(err);
        callback({message: "Fatal error in getUserAccount"});
      } else {
        // check if user can vote, if not this app is useless
        if (!result[0].can_vote) {
          console.error("User "+process.env.STEEM_USER+"cannot vote!");
          callback({message: "Fatal error in getUserAccount"});
          return;
        }
        // save some values about this user in owner object
        owner.voting_power = result[0].voting_power;
        owner.last_vote_time = result[0].last_vote_time;
        owner.last_post_time = (new Date() - getEpochMillis(result[0].last_root_post)) / 60000; // convert ms to mins
        steem.api.getDynamicGlobalProperties(function(err, properties) {
          //console.log(err, properties);
          if (err) {
            console.error("Can't get DynamicGlobalProperties, can't calculate user's Steem Power");
            callback({message: "Fatal error in getUserAccount"});
          } else {
            steemGlobalProperties = properties;
            owner.steem_power = getSteemPowerFromVest(result[0].vesting_shares);
          }
          // get latest blocktime
          steem.api.getBlockHeader(properties.head_block_number, function(err, headBlock) {
            //callback(err, result);
            if (err) {
              console.error("Can't get head block info");
            } else {
              owner.latest_block_time = moment(headBlock.timestamp, moment.ISO_8601);
              console.log("latest block time: "+owner.latest_block_time.toISOString());
              // adjust voting power
              var lastVoteTime = moment(owner.last_vote_time);
              var secondsDiff = (owner.latest_block_time.valueOf() - lastVoteTime.valueOf()) / 1000;
              if (secondsDiff > 0) {
                var vpRegenerated = secondsDiff * 10000 / 86400 / 5;
                owner.voting_power += vpRegenerated;
              }
              if (owner.voting_power > 10000) {
                owner.voting_power = 10000;
              }
              console.log(" - - new vp(corrected): "+owner.voting_power);
              // get followers
              getFollowers_recursive(process.env.STEEM_USER, null, function(err, followersResult) {
                console.log("getFollowing");
                following = [];
                if (err || followersResult === undefined) {
                  console.error("Can't get following accounts");
                  callback({message: "Fatal error in getUserAccount"});
                } else {
                  following = followersResult;
                }
                console.log(""+process.env.STEEM_USER+" follows: "+following);
                // final callback without error, all functions completed
                callback();
              });
              // log owner object
              console.log("owner: "+JSON.stringify(owner));
            }
          });
        });
      }
    });
  } else {
    console.error("No STEEM_USER environment variable set");
    callback({message: "Fatal error in getUserAccount"});
  }
}

function getFollowers_recursive(username, followers, callback) {
  var followers_;
  if (followers == null || followers === undefined) {
    followers_ = [];
  } else {
    followers_ = followers;
  }
  persistentLog(LOG_VERBOSE, "getFollowers_recursive");
  var startFollowerName = followers_.length < 1 ? null : followers_[followers_.length-1];
  steem.api.getFollowing(username, startFollowerName, null, 100, function(err, followersResult) {
    if (err || followersResult == null || followersResult === undefined) {
      persistentLog(LOG_VERBOSE, "getFollowers_recursive, error");
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")},
          null);
      return;
    }
    persistentLog(LOG_VERBOSE, "getFollowers_recursive, got "+followersResult.length+" results");
    persistentLog(LOG_VERBOSE, "getFollowers_recursive, followers in result: "+JSON.stringify(followersResult));
    // skip first username in results if search with name as that will be the first and we already have it from the
    //    last page
    for (var i = (startFollowerName == null ? 0 : 1) ; i < followersResult.length ; i++) {
      if (followersResult[i].what.indexOf('blog') >= 0) {
        followers_.push(followersResult[i].following);
      }
    }
    persistentLog(LOG_VERBOSE, "getFollowers_recursive, followers now "+followers_.length);
    if (followersResult.length < 100) {
      persistentLog(LOG_VERBOSE, "getFollowers_recursive, finished");
      persistentLog(LOG_VERBOSE, "getFollowers_recursive, followers: "+JSON.stringify(followers_));
      callback(null, followers_);
    } else {
      getFollowers_recursive(username, followers_, callback);
    }
  });
}

function getPosts_recursive(posts, stopAtPost, limit, callback) {
  persistentLog(LOG_VERBOSE, "getPosts_recursive");
  var posts_;
  if (posts == null || posts === undefined) {
    posts_ = [];
  } else {
    posts_ = posts;
  }
  var query = {
    limit: MAX_POST_TO_READ_PER_QUERY
  };
  if (posts_.length > 0) {
    query.start_permlink = posts_[posts_.length - 1].permlink;
    query.start_author = posts_[posts_.length - 1].author;
  }
  steem.api.getDiscussionsByCreated(query, function(err, postsResult) {
    if (err || postsResult == null || postsResult === undefined) {
      persistentLog(LOG_VERBOSE, "getPosts_recursive, error");
      callback({message: "error: "+(err != null ? err.message + ", " + JSON.stringify(err.payload) : "null result")},
        null);
      return;
    }
    persistentLog(LOG_VERBOSE, "getPosts_recursive, got "+postsResult.length+" results");
    // skip first post in results if search with permlink and author
    // as that will be the first and we already have it from the
    //    last page
    var limitReached = false;
    for (var i = (query.start_permlink === undefined ? 0 : 1) ; i < postsResult.length ; i++) {
      // #57, check for null post in list
      if (postsResult[i] === undefined || postsResult[i] == null) {
        persistentLog(LOG_VERBOSE, "getPosts_recursive, a post object is null, skipping");
        continue;
      }
      if (stopAtPost !== undefined && stopAtPost != null && postsResult[i].id == stopAtPost.id) {
        persistentLog(LOG_VERBOSE, "getPosts_recursive, limit reached at last post");
        limitReached = true;
        break;
      }
      posts_.push(postsResult[i]);
      if (posts_.length >= limit) {
        persistentLog(LOG_VERBOSE, "getPosts_recursive, limit reached at max num to fetch");
        limitReached = true;
        break;
      }
    }
    persistentLog(LOG_VERBOSE, "getPosts_recursive, posts now "+posts_.length);
    if (limitReached || postsResult.length < MAX_POST_TO_READ_PER_QUERY || posts_.length == 0) {
      persistentLog(LOG_VERBOSE, "getPosts_recursive, finished");
      callback(null, posts_);
    } else {
      getPosts_recursive(posts_, stopAtPost, limit, callback);
    }
  });
}

function persistObj(collection, obj, callback) {
  db.collection(collection).drop();
  db.collection(collection).save(obj, function (err, existing) {
    if (err) {
      callback(err);
    } else {
      persistentLog(LOG_VERBOSE, "persistObj save to db "+collection);
      callback();
    }
  });
}

function getPersistentObj(collection, callback) {
  db.collection(collection).find({}).toArray(function(err, obj) {
    if (err) {
      callback(err);
    } else if (obj !== undefined && obj !== null && obj.length !== 0){
      callback(null, obj[0]);
    } else {
      callback(null, null);
    }
  });
}


/*
updateWeightMetric(query, apiKey, callback):
* update weight metric
*/
function updateWeightMetric(query, apiKey, callback) {
  persistentLog(LOG_VERBOSE, "updateWeightMetric call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback !== undefined) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  if (metricKeys.indexOf(query.key) < 0) {
    if (callback !== undefined) {
      callback({status: 500, message: "key "+query.key+" not valid"});
    }
    return;
  }
  getPersistentObj(DB_ALGORITHM, function(err1, algorithmResult) {
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      persistentLog(LOG_VERBOSE, " - updated algorithm from db: "+JSON.stringify(algorithm));
    }
    var match = false;
    for (var i = 0 ; i < algorithm.weights.length ; i++) {
      if (algorithm.weights[i].key.localeCompare(query.key) == 0) {
        algorithm.weights[i] = query;
        match = true;
        break;
      }
    }
    if (!match) {
      algorithm.weights.push(query);
    }
    persistentLog(LOG_VERBOSE, "algorithm to save: "+JSON.stringify(algorithm));
    persistObj(DB_ALGORITHM, algorithm, function (err2, result) {
      if (err2) {
        console.error(err2);
        callback({status: 200, message: "Failed to save updated" +
        " algorithm: "+err2});
      } else {
        callback({status: 200, message: "Added key to algorithm: "+query.key});
      }
    });
  });
}

/*
deleteWeightMetric(index, apiKey, callback):
* update weight metric
*/
function deleteWeightMetric(key, apiKey, callback) {
  persistentLog(LOG_VERBOSE, "deleteWeightMetric call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback !== undefined) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  getPersistentObj(DB_ALGORITHM, function(err, algorithmResult) {
    if (err) {
      persistentLog(LOG_VERBOSE, " - coudln't get from db, using" +
        " local version");
    } else {
      algorithm = algorithmResult;
      persistentLog(LOG_VERBOSE, " - updated algorithm from db: "+JSON.stringify(algorithm));
    }
    var newWeights = [];
    for (var i = 0 ; i < algorithm.weights.length ; i++) {
      if (algorithm.weights[i].key.localeCompare(key) != 0) {
        newWeights.push(algorithm.weights[i]);
      } // else don't add, effectively delete
    }
    algorithm.weights = newWeights;
    persistObj(DB_ALGORITHM, algorithm, function(err, data) {
      // do nothing
    });
    if (callback !== undefined) {
      callback({status: 200, message: "Removed key from algorithm: "+key});
    }
  });
}

/*
updateMetricList(list, contents, apiKey, callback):
* update weight metric
*/
function updateMetricList(list, contents, apiKey, callback) {
  persistentLog(LOG_VERBOSE, "updateMetricList call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback !== undefined) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  // format contents
  var parts = S(contents.replace("  ", " ")).splitLeft(" ");
  getPersistentObj(DB_ALGORITHM, function(err, algorithmResult) {
    if (err) {
      persistentLog(LOG_VERBOSE, " - coudln't from db, using local" +
        " version");
      if (algorithm === undefined || algorithm == null) {
        algorithm = {
          weights: [],
          authorWhitelist: [],
          authorBlacklist: [],
          contentCategoryWhitelist: [],
          contentCategoryBlacklist: [],
          contentWordWhitelist: [],
          contentWordBlacklist: [],
          domainWhitelist: [],
          domainBlacklist: []
        };
      }
    } else {
      algorithm = algorithmResult;
      persistentLog(LOG_VERBOSE, " - updated algorithm from db: "+JSON.stringify(algorithm));
    }
    algorithm[list] = parts;
    persistObj(DB_ALGORITHM, algorithm, function(err, data) {});
    if (callback !== undefined) {
      callback({status: 200, message: "Updated black / white list: "+list});
    }
  });
}

function savePostsMetadata(callback) {
  persistentLog(LOG_VERBOSE, "savePostsMetadata");
  db.collection(DB_POSTS_METADATA).find({}).toArray(function(err, postsMetaDataResults) {
    if (err || postsMetaDataResults === null && postsMetaDataResults.length === 0 || postsMetaDataResults[0] === null) {
      console.log("Couldn't access posts metadata");
      if (callback !== undefined) {
        callback({status: 500, message: "savePostsMetadata, error saving" +
          " new object: " + err.message});
      }
    } else {
      var numRemoved = 0;
      for (var i = 0 ; i < postsMetaDataResults.length ; i++) {
        if (((new Date()).getTime() - postsMetaDataResults[i].save_date) > (configVars.DAYS_KEEP_LOGS * MILLIS_IN_DAY)) {
          // remove
          db.collection(DB_POSTS_METADATA).remove(postsMetaDataResults[i], function (err, data) {
            if (err) {
              persistentLog(LOG_GENERAL, " - - failed to remove old" +
                " posts metadata obj");
            }
          });
          numRemoved++;
        }
      }
      // add new obj
      var postsMetadataList = {
        save_date: (new Date()).getTime(),
        posts_metadata_list: postsMetadata
      };
      db.collection(DB_POSTS_METADATA).save(postsMetadataList, function (err, data) {
        if (err) {
          persistentLog(LOG_GENERAL, " - - error saving posts metadata");
          if (callback !== undefined) {
            callback({status: 500, message: "savePostsMetadata, error saving" +
              " new object: " + err.message});
          }
        } else {
          persistentLog(LOG_VERBOSE, " - - saved posts metadata");
          if (callback !== undefined) {
            callback({status: 200, message: "savePostsMetadata, success, saved postsMetadata"});
          }
        }
      });
    }
  });
}

function getPostsMetadataList(save_date, callback) {
  persistentLog(LOG_VERBOSE, " - fetching posts metadata for save_date: "+save_date);
  db.collection(DB_POSTS_METADATA).find({"save_date": Number(save_date)}).toArray(function(err, postsMetaDataResults) {
    if (err || postsMetaDataResults === undefined || postsMetaDataResults === null
        || postsMetaDataResults.length === 0 || postsMetaDataResults[0] === undefined
        || postsMetaDataResults[0] === null) {
      callback(err, null);
    } else {
      callback(null, postsMetaDataResults[0].posts_metadata_list);
    }
  });
}

function getPostsMetadataAllDates(callback) {
  db.collection(DB_POSTS_METADATA).find({}).toArray(function(err, postsMetaDataResults) {
    if (err || postsMetaDataResults === null && postsMetaDataResults.length === 0) {
      callback(err, null);
    } else {
      var result = [];
      for (var i = 0 ; i < postsMetaDataResults.length ; i++) {
        result.push(postsMetaDataResults[i].save_date);
      }
      callback(null, result);
    }
  });
}

function getPostsMetadataSummary(callback) {
  var summary = [];
  db.collection(DB_POSTS_METADATA).find({}).count(function(err, count) {
      if (err) {
        console.error(err);
        callback(summary);
      } else {
        var recordsCount = count;
        db.collection(DB_POSTS_METADATA).find({}).forEach(function(doc) {
          wait.launchFiber(function() {
            var numVotes = 0;
            for (var j = 0; j < doc.posts_metadata_list.length; j++) {
              if (doc.posts_metadata_list[j].vote) {
                numVotes++;
              }
            }
            var dateTime = moment_tz.tz(doc.save_date, configVars.TIME_ZONE);
            summary.push({
              date: doc.save_date,
              date_str: (dateTime.format("MM/DD/YY HH:mm")),
              date_day: dateTime.date(),
              num_posts: doc.posts_metadata_list.length,
              num_votes: numVotes
            });

            // TODO : use a better method than a counter to know when forEach done
            if (--recordsCount <= 0) {
              // done
              persistentLog(LOG_VERBOSE, "Finished getPostsMetadataSummary");
              callback(summary);
            }
          });
        }, function(err) {
          if (err) {
            console.error(err);
            callback(summary);
          }
        });
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
    console.error(err);
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

function getConfigVars() {
  return configVars;
}

function updateConfigVars(newConfigVars, callback) {
  // migrate old config vars if needed
  // add missing vars
  for (var key in defaultConfigVars) {
    if (!newConfigVars.hasOwnProperty(key)) {
      newConfigVars[key] = defaultConfigVars[key];
    }
  }
  // remove deprecated vars
  for (var key in newConfigVars) {
    if (!defaultConfigVars.hasOwnProperty(key)) {
      delete newConfigVars[key];
    }
  }
  configVars = newConfigVars;
  persistentLog(LOG_VERBOSE, "updateConfigVars: "+JSON.stringify(newConfigVars));
  persistObj(DB_CONFIG_VARS, newConfigVars, function(err) {
    if (err) {
      persistentLog(LOG_VERBOSE, "Error updating config vars: "+err.message);
      callback({message: "Fatal error in updateConfigVars"});
    } else {
      callback();
    }
  })
}


/*
* Util
*/

function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}

/*
* Test functions
*/

/*
testEnvVars():
* Test environment variables and log results
*/
function testEnvVars(callback) {
  console.log("steem user: "+process.env.STEEM_USER);
  if (!process.env.STEEM_USER) {
    console.error("No STEEM_USER config var set, minimum env vars requirements not met");
  }
  console.log("private posting key?: "+(process.env.POSTING_KEY_PRV ? "true" : "false"));
  if (!process.env.POSTING_KEY_PRV) {
    console.error("No POSTING_KEY_PRV config var set, minimum env vars requirements not met");
  }
  console.log("api key?: "+(process.env.BOT_API_KEY ? "true" : "false"));
  if (!process.env.BOT_API_KEY) {
    console.error("No BOT_API_KEY config var set, minimum env vars requirements not met");
  }

  callback();
}

function startDb(callback) {
  mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      db = database;
      console.log("Database connection ready");
      callback();
    }
  });
}


/* Set public API */
module.exports.DB_ALGORITHM = DB_ALGORITHM;

module.exports.runBot = runBot;
module.exports.testEnvVars = testEnvVars;
module.exports.initLib = initLib;
module.exports.persistObj = persistObj;
module.exports.getPersistentObj = getPersistentObj;
module.exports.getDailyLikedPosts = getDailyLikedPosts;
module.exports.updateWeightMetric = updateWeightMetric;
module.exports.deleteWeightMetric = deleteWeightMetric;
module.exports.updateMetricList = updateMetricList;
module.exports.getPostsMetadataList = getPostsMetadataList;
module.exports.getPostsMetadataAllDates = getPostsMetadataAllDates;
module.exports.getPostsMetadataSummary = getPostsMetadataSummary;
module.exports.getEpochMillis = getEpochMillis;
module.exports.getConfigVars = getConfigVars;
module.exports.updateConfigVars = updateConfigVars;
