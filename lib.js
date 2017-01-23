'use strict';

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
  sentiment = require('retext-sentiment'),
  wait = require('wait.for'),
  extra = require('./extra.js'),
  LanguageDetect = require('languagedetect'),
  langDetector = new LanguageDetect();

const
  MILLIS_IN_DAY = 86400000;

var
  MAX_POST_TO_READ = 100,
  CAPITAL_DOLPHIN_MIN = 25000,
  CAPITAL_WHALE_MIN = 100000,
  MIN_KEYWORD_LEN = 4,
  MIN_SCORE_THRESHOLD = 50,
  SCORE_THRESHOLD_INC_PC = 0.1,
  NUM_POSTS_FOR_AVG_WINDOW = 20,
  MAX_VOTES_IN_24_HOURS = 40,
  MIN_WORDS_FOR_ARTICLE = 100,
  DAYS_KEEP_LOGS = 5,
  MIN_POST_AGE_TO_CONSIDER = 30,
  MIN_LANGUAGE_USAGE_PC = 0.35;

/* Private variables */
var fatalError = false;
var serverState = "stopped";

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
}

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
  windowSize: NUM_POSTS_FOR_AVG_WINDOW
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

/*
persistentLog(msg):
* Logs to console and appends to log var
*/
function persistentLog(msg) {
  console.log(msg);
  /*
  if (++logNumLines % 500 == 0) {
    console.log("persistentLog logged another 50 lines...");
  }
  */
  log += ((log.length > 0) ? "\n" : "") + msg;
  logHtml += ((logHtml.length > 0) ? "<br/>" : "") + msg;
}

/*
runBot(messageCallback):
* Process a bot iteration
*/
function runBot(callback, options) {
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
    // pre set up
    function () {
      numVoteOn = 0;
      log = "";
      persistentLog("Q.deffered: pre set up");
      var deferred = Q.defer();
      // update average window details
      getPersistentJson("avg_window_info", function(info) {
        if (info != null) {
          avgWindowInfo = info;
          persistentLog(" - updated avgWindowInfo from redis store: "+JSON.stringify(avgWindowInfo));
        } else {
          persistentLog(" - no avgWindowInfo in redis store, probably first time bot run");
        }
        getPersistentJson("algorithm", function(algorithmResult) {
          if (algorithmResult != null) {
            algorithmSet = true;
            algorithm = algorithmResult;
            persistentLog(" - updated algorithm from redis store: "+JSON.stringify(algorithm));
          } else {
            algorithmSet = false;
            persistentLog(" - no algorithm in redis store, empty");
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
          deferred.resolve(true);
        });
      })
      return deferred.promise;
    },
    // get posts
    function () {
      persistentLog("Q.deffered: get posts");
      var deferred = Q.defer();
      // get posts
      if (options && options.hasOwnProperty("author")
            && options.hasOwnProperty("permlink")) {
        persistentLog(" - get post by author: "+options.author+", permlink: "+options.permlink);
        steem.api.getContent(options.author, options.permlink, function(err, post) {
          if (err) {
            throw {message: "Error reading post for permlink: "+options.permlink};
          }
          persistentLog(" - got post by permlink: "+JSON.stringify(post));
          posts = [post];
          deferred.resolve(true);
        });
      } else {
        steem.api.getDiscussionsByCreated({limit: MAX_POST_TO_READ}, function(err, result) {
          if (err) {
            throw {message: "Error reading posts from steem: "+err.message};
          }
          posts = result;
          persistentLog(" - num fetched posts: "+posts.length);
          deferred.resolve(true);
        });
      }
      return deferred.promise;
    },
    // clean posts and update last fetched post
    function () {
      persistentLog("Q.deferred: clean posts");
      var deferred = Q.defer();
      if (options && options.hasOwnProperty("permlink")) {
        // do nothing, posts should just contain permlink
      } else if (options && options.hasOwnProperty("limit")) {
        // keep numPosts number of posts
        var cleanedPosts = [];
        for (var i = 0 ; i < posts.length ; i++) {
          if (cleanedPosts.length >= options.limit) {
            break;
          }
          cleanedPosts.push(posts[i]);
        }
        posts = cleanedPosts;
      } else {
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
        // only keep posts older than limit
        if (MIN_POST_AGE_TO_CONSIDER > 0) {
          var now = (new Date()).getTime();
          var cleanedPosts = [];
          for (var i = 0 ; i < posts.length ; i++) {
            var timeDiff = now - getEpochMillis(posts[i].created);
            if (timeDiff > 0) {
              timeDiff /= (60 * 1000);
            }
            if (timeDiff >= MIN_POST_AGE_TO_CONSIDER) {
              cleanedPosts.push(posts[i]);
            }
          }
          posts = cleanedPosts;
        }
      }
      // throw nice error if no posts left
      if (posts.length < 1) {
        throw {message: "No new posts since last post and within minimum time of "+MIN_POST_AGE_TO_CONSIDER+" minutes"};
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
        persistentLog(" - - metrics.post.post_num_upvotes: "+metric.post_num_upvotes);
        persistentLog(" - - metrics.post.post_num_downvotes: "+metric.post_num_downvotes);
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
        // up votes
        postsMetrics[i].post_up_voted_num_dolphin = 0;
        postsMetrics[i].post_up_voted_num_whale = 0;
        postsMetrics[i].post_up_voted_num_followed = 0;
        postsMetrics[i].post_up_voted_num_whitelisted = 0;
        postsMetrics[i].post_up_voted_num_blacklisted = 0;
        for (var j = 0 ; j < posts[i].up_votes.length ; j++) {
          //persistentLog(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].up_votes[j].voter;
          if (voter.localeCompare(process.env.STEEM_USER) != 0
              && users[voter]) {
            var voterAccount = users[voter];
            // determine if dolphin or whale, count
            var steemPower = getSteemPowerFromVest(voterAccount.vesting_shares);
            if (steemPower >= CAPITAL_WHALE_MIN) {
              postsMetrics[i].post_up_voted_num_whale++;
            } else if (steemPower >= CAPITAL_DOLPHIN_MIN) {
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
          //persistentLog(" - - - ["+j+"]: "+JSON.stringify(posts[i].active_votes[j]));
          var voter = posts[i].down_votes[j].voter;
          if (voter.localeCompare(process.env.STEEM_USER) != 0
            && users[voter]) {
            var voterAccount = users[voter];
            // determine if dolphin or whale, count
            var steemPower = getSteemPowerFromVest(voterAccount.vesting_shares);
            if (steemPower >= CAPITAL_WHALE_MIN) {
              postsMetrics[i].post_down_voted_num_whale++;
            } else if (steemPower >= CAPITAL_DOLPHIN_MIN) {
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
        persistentLog(" - - nlp.content (length): "+nlp.content.length);
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
        //persistentLog(" - - - removed "+removedCount+" short keywords");
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
                persistentLog(" - - - sentiment extraction error: "+err.message);
              }
              //persistentLog(" - - nlp.sentiment: "+nlp.sentiment);
              postsNlp.push(nlp);
              // count words using tree, i.e. count WordNode instances
              nlp.num_words = countWordsFromRetext(tree);
              //persistentLog(" - - nlp.num_words: "+nlp.num_words);
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
        //persistentLog(" - postsMetrics ["+i+"]");
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
              //persistentLog(" - - checking tags");
              for (var j = 0 ; j < metadata.tags.length ; j++) {
                var tag = metadata.tags[j];
                postsMetrics[i].post_num_tags_whitelisted += (algorithm.contentCategoryWhitelist.indexOf(tag) > 0) ? 1 : 0;
                postsMetrics[i].post_num_tags_blacklisted += (algorithm.contentCategoryWhitelist.indexOf(tag) > 0) ? 1 : 0;
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
        //persistentLog(" - - checking keywords");
        for (var j = 0 ; j < nlp.keywords.length ; j++) {
          var keyword = nlp.keywords[j];
          postsMetrics[i].post_num_keywords_whitelisted += (algorithm.contentWordWhitelist.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_keywords_blacklisted += (algorithm.contentWordBlacklist.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_words_whitelisted += (nlp.content.indexOf(keyword) > 0) ? 1 : 0;
          postsMetrics[i].post_num_words_blacklisted += (nlp.content.indexOf(keyword) > 0) ? 1 : 0;
        }
        // - bool
        postsMetrics[i].post_category_whitelisted = (algorithm.contentCategoryWhitelist.indexOf(posts[i].category) > 0) ? 1 : 0;
        postsMetrics[i].post_category_blacklisted = (algorithm.contentCategoryBlacklist.indexOf(posts[i].category) > 0) ? 1 : 0;
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
        //persistentLog(" - - classifying urls");
        for (var j = 0 ; j < nlp.urls.length ; j++) {
          var url = nlp.urls[j];
          postsMetrics[i].post_num_links_total++;
          //persistentLog(" - - - url: "+url);
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
          //persistentLog(" - - - domain: "+domain);
          // track matching progress
          var match = false;
          // check if is image
          for (var k = 0 ; k < imagesExt.length ; k++) {
            if (S(url).endsWith("."+imagesExt[k])) {
              postsMetrics[i].post_num_links_image++;
              //persistentLog(" - - - - is image");
              match = true;
              break;
            }
          }
          // check if is video link
          if (!match) {
            if (videoDomains.indexOf(domain) >= 0) {
              postsMetrics[i].post_num_links_video++;
              //persistentLog(" - - - - is video");
              match = true;
            }
          }
          // if not image or video, assume is normal webpage
          if (!match) {
            postsMetrics[i].post_num_links_page++;
          }
          // check for domain presence on white / black list
          postsMetrics[i].post_num_link_domains_whitelisted += (algorithm.domainWhitelist.indexOf(domain) > 0) ? 1 : 0;
          postsMetrics[i].post_num_link_domains_blacklisted += (algorithm.domainBlacklist.indexOf(domain) > 0) ? 1 : 0;
          // Content - complex, using more than one other metric to create a metric
          postsMetrics[i].post_very_short = 0;
          postsMetrics[i].post_images_only = 0;
          postsMetrics[i].post_videos_only = 0;
          postsMetrics[i].post_mixed_links_only = 0;
          if (postsMetrics[i].post_num_words < MIN_WORDS_FOR_ARTICLE) {
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
        persistentLog("langDetector, available languages: "+JSON.parse(langDetector.getLanguages()));
        postsMetrics[i].post_has_english_language_use = 0;
        postsMetrics[i].post_has_german_language_use = 0;
        postsMetrics[i].post_has_spanish_language_use = 0;
        postsMetrics[i].post_has_french_language_use = 0;
        var languages = langDetector.detect(nlp.content);
        for (var j = 0 ; j < languages.length ; j++) {
          if (languages[j][0].localeCompare('english') == 0
              && languages[j][1] > MIN_LANGUAGE_USAGE_PC) {
            postsMetrics[i].post_has_english_language_use = 1;
          } else if (languages[j][0].localeCompare('german') == 0
            && languages[j][1] > MIN_LANGUAGE_USAGE_PC) {
            postsMetrics[i].post_has_german_language_use = 1;
          } else if (languages[j][0].localeCompare('spanish') == 0
            && languages[j][1] > MIN_LANGUAGE_USAGE_PC) {
            postsMetrics[i].post_has_spanish_language_use = 1;
          } else if (languages[j][0].localeCompare('french') == 0
            && languages[j][1] > MIN_LANGUAGE_USAGE_PC) {
            postsMetrics[i].post_has_french_language_use = 1;
          }
        }
      }
      // finish
      persistentLog(" - finished gathering metrics");
      //persistentLog(" - postsMetrics array: "+JSON.stringify(postsMetrics));
      deferred.resolve(true);
      return deferred.promise;
    },
    // calculate scores for each post
    function () {
      persistentLog("Q.deferred: calculate scores for each post");
      var deferred = Q.defer();
      // calculate scores
      postsMetadata = [];
      for (var i = 0 ; i < postsMetrics.length ; i++) {
        persistentLog(" - - post "+i);
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
              //persistentLog(" - - - - - bounding metric("+value+") for range "+lower+" to "+upper);
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
              //persistentLog(" - - - - - after bounding: "+value);
            }
            var metricScore = {
              key: algorithm.weights[j].key,
              value: value,
              weight: weight,
              score: (value * weight)
            }
            scoreDetail.total += metricScore.score;
            scoreDetail.metrics.push(metricScore);
            persistentLog(" - - - - "+algorithm.weights[j].key+": "+value+" * weight("+weight+") = "+metricScore.score);
          } else {
            persistentLog(" - - - - error, key not found in metrics: "+weight);
          }
        }
        persistentLog(" - - FINAL SCORE: "+scoreDetail.total);
        postsMetadata.push(
          {
            title: posts[i].title,
            url: "https://steemit.com"+posts[i].url,
            author: posts[i].author,
            time: posts[i].created,
            cur_est_payout: postsMetrics[i].post_est_payout,
            upvotes: postsMetrics[i].post_num_upvotes,
            downvotes: postsMetrics[i].post_num_downvotes,
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
      persistentLog("Q.deferred: choose posts to vote on based on scores");
      var deferred = Q.defer();
      for (var i = 0 ; i < posts.length ; i++) {
        var thresholdInfo = {};
        // add this score first, if meets minimum
        if (postsMetadata[i].score >= MIN_SCORE_THRESHOLD) {
        	avgWindowInfo.postScores.push(postsMetadata[i].score);
        }
        // recalculate avgerage based on window value
        persistentLog(" - - recalculating score threshold with window:"+JSON.stringify(avgWindowInfo.postScores));
        var avg = 0;
        var maxScore = 0;
        var count = 0;
        for (var j = 0 ; j < avgWindowInfo.postScores.length ; j++) {
          if (avgWindowInfo.postScores[j] > MIN_SCORE_THRESHOLD) {
            avg += avgWindowInfo.postScores[j];
            count++;
            if (avgWindowInfo.postScores[j] > maxScore) {
              maxScore = avgWindowInfo.postScores[j];
            }
          }
        }
        var threshold = 0;
        if (avg != 0 && count > 0) {
          threshold = avg / count;
        }
        thresholdInfo.average = threshold;
        if (threshold < MIN_SCORE_THRESHOLD) {
          threshold = MIN_SCORE_THRESHOLD;
          // stats
          thresholdInfo.min = MIN_SCORE_THRESHOLD;
          thresholdInfo.percentInc = 0;
          thresholdInfo.voteAdjustmentInc = 0;
          thresholdInfo.total = threshold;
        } else {
          // first apply precentage increase on threshold,
          //   i.e. must be SCORE_THRESHOLD_INC_PC % better than average to be selected
          thresholdInfo.percentInc = (threshold * SCORE_THRESHOLD_INC_PC);
          threshold += thresholdInfo.percentInc;
          // then add more (make more unlikely to vote on) proportional to how many votes already
          //   cast today. if there are max or exceeding max voted, threshold will be too high for
          //   vote and no post will be voted on, thus maintaining limit
          thresholdInfo.voteAdjustmentInc = (maxScore - threshold) * Math.pow(owner.num_votes_today / MAX_VOTES_IN_24_HOURS, 2);
          threshold += thresholdInfo.voteAdjustmentInc;
          thresholdInfo.total = threshold;
          avgWindowInfo.scoreThreshold = threshold;
        }
        postsMetadata[i].thresholdInfo = thresholdInfo;
        avgWindowInfo.scoreThreshold = threshold;
        persistentLog(" - - - new avg / score threshold: "+avgWindowInfo.scoreThreshold);
        persistentLog(" - - - - new threshold info: "+JSON.stringify(thresholdInfo));
        // prune scores in window list to keep at NUM_POSTS_FOR_AVG_WINDOW size
        if ((avgWindowInfo.postScores.length - NUM_POSTS_FOR_AVG_WINDOW) >= 0) {
          var newScoresWindow = [];
          for (var j = avgWindowInfo.postScores.length - NUM_POSTS_FOR_AVG_WINDOW ; j < avgWindowInfo.postScores.length ; j++) {
            newScoresWindow.push(avgWindowInfo.postScores[j]);
          }
          avgWindowInfo.postScores = newScoresWindow;
        }

        // check if post score is above threshold, set to vote if is
        var toVote = false;
        if (postsMetadata[i].score > avgWindowInfo.scoreThreshold) {
          toVote = true;
          persistentLog(" - - "+postsMetadata[i].score+" >= "+avgWindowInfo.scoreThreshold+", WILL vote on post ["+posts[i].permlink+"]");
        } else {
          persistentLog(" - - "+postsMetadata[i].score+" < "+avgWindowInfo.scoreThreshold+", WILL NOT vote on post ["+posts[i].permlink+"]");
        }
        postsMetadata[i].vote = toVote;
      }
      // save updated avgWindowInfo
      persistentLog(" - saving avg_window_info");
      persistJson("avg_window_info", avgWindowInfo, function(err) {
        persistentLog(" - - ERROR SAVING avg_window_info");
      });
      // finish
      deferred.resolve(true);
      return deferred.promise;
    },
    // return http before casting votes
    function () {
      persistentLog("Q.deferred: return http before casting votes");
      var deferred = Q.defer();
      // finally, send good http response back
      // back to http
      if (callback) {
        callback(
          {
            status: 200, 
            message: "Scores calculated, votes will now be cast. Check log and / or email for full log and result.",
            posts: postsMetadata
          });
      }
      // and save postsMetadata to persistent
      persistentLog(" - saving posts_metadata");
      savePostsMetadata({postsMetadata: postsMetadata}, function(res) {
        persistentLog(" - - SAVING posts_metadata: "+res.message);
        // finish
        deferred.resolve(true);
      })
      return deferred.promise;
    },
    // cast votes to steem
    function () {
      persistentLog("Q.deferred: cast votes to steem");
      var deferred = Q.defer();
      var count = 0;
      // cast vote
      persistentLog(" - voting");
      if (postsMetadata.length > 0) {
        wait.launchFiber(function() {
          var numToVoteOn = 0;
          numVoteOn = numToVoteOn;
          for (var i = 0 ; i < postsMetadata.length ; i++) {
            var doVote = true;
            if (options && options.test) {
              doVote = false;
            }
            if (doVote) {
              if (postsMetadata[i].vote) {
                numToVoteOn++;
              }
            }
          }
          var numVotedOn = 0;
          for (var i = 0 ; i < postsMetadata.length ; i++) {
            persistentLog(" - - - "+(postsMetadata[i].vote ? "YES" : "NO")+" vote on post, score: "
                +postsMetadata[i].score+", permlink: "+postsMetadata[i].permlink);
            var doVote = true;
            if (options && options.test) {
              doVote = false;
            }
            if (doVote) {
              if (postsMetadata[i].vote) {
                // vote!
                try {
                  var upvoteResult = wait.for(steem.broadcast.vote, process.env.POSTING_KEY_PRV,
                        process.env.STEEM_USER, postsMetadata[i].author,
                        postsMetadata[i].permlink, 10000);
                  console.log(" - - - - upvoted with result: "+JSON.stringify(upvoteResult));
                } catch (err) {
                  persistentLog(" - - - - ERROR voting on post: "+postsMetadata[i].permlink);
                }
                numVotedOn++;
                console.log(" - - - - voted on vote " + numVotedOn + " of "+numToVoteOn);
                // wait 5 seconds
                console.log(" - - - waiting 3 seconds...");
                var timeOutWrapper = function (delay, func) {
                  setTimeout(function() {
                    func(null, true);
                  }, delay);
                }
                var timeOutResult = wait.for(timeOutWrapper, 5000);
                console.log(" - - - finished waiting");
              } else {
                console.log(" - - - - not voting on post: "+postsMetadata[i].permlink);
              }
            } else {
              console.log(" - - - - TEST, not voting on post: "+postsMetadata[i].permlink);
            }
          }
          console.log(" - finished voting");
          deferred.resolve(true);
        });
      } else {
        persistentLog(" - - no post to vote on");
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
      persistentLog("runBot finished successfully");
      console.log("runBot finished successfully");
      var email = "<html><body><h1>Update: runBot iteration finished successfully</h1>";
      email += "<h3>at "+((new Date()).toUTCString())+"</h3>";
      //algorithmSet
      if (!algorithmSet) {
        email += "<h3>Note, using default algorithm, no algorithm set! See below for details</h3>";
      }
      if (options && options.test) {
        email += "<h3>TEST RUN - no votes will be cast</h3>";
      }
      email += "<h2>User stats</h2>";
      email += "<p>User: "+process.env.STEEM_USER+"</p>";
      var votingPower = (owner.voting_power > 0 ? owner.voting_power / 100 : 0).toFixed(2);
      email += "<p>Voting power: "+votingPower+"</p>";
      email += "<h2>Posts and scores:</h2>";
      if (postsMetadata.length > 0) {
        // first sort postsMetadata
        var maxScore = Number.MAX_VALUE;
        var sortedPostsMetadata = postsMetadata.sort(function(a, b) {
          return b.score - a.score;
        });
        // add to email
        for (var i = 0 ; i < sortedPostsMetadata.length ; i++) {
          email += "<p><span style=\"color: "+(sortedPostsMetadata[i].vote ? "green" : "red")+";\">"
            +"Score <strong>"+sortedPostsMetadata[i].score.toFixed(2)+"</strong> "
            +"| <a href=\""+sortedPostsMetadata[i].url+"\"><strong>"+sortedPostsMetadata[i].title+"</strong></a> "
            +"| author: "+sortedPostsMetadata[i].author + " "
            +"| cur est $"+sortedPostsMetadata[i].cur_est_payout.toFixed(3)+" "
            +"| upvotes: "+postsMetrics[i].post_num_upvotes+" "
            +"| downvotes: "+postsMetrics[i].post_num_downvotes+" "
            +"| age: "+postsMetrics[i].post_alive_time.toFixed(2)+" mins "
            +"</span></p>";
        }
      } else {
        email += "<p><span style=\"color: red;\"><strong>No new posts found</strong></span></p>";
      }
      email += "</hr>"
      email += "<h2>User weights and config:</h2>";
      email += "<h3>Weights</h3>";
      if (algorithm.weights.length > 0) {
        for (var i = 0 ; i < algorithm.weights.length ; i++) {
          email += "<p>Key: <strong>"+algorithm.weights[i].key+"</strong>, value: <strong>"
              +algorithm.weights[i].value+"</strong>";
          if (algorithm.weights[i].hasOwnProperty("lower")) {
            email += ", lower bound: "+algorithm.weights[i].lower;
          }
          if (algorithm.weights[i].hasOwnProperty("upper")) {
            email += ", upper bound: "+algorithm.weights[i].upper;
          }
          email += "</p>";
        }
      } else {
        email += "<p><span style=\"color: red;\">No weights! Please set in algorithm</span></p>";
      }
      //var weightsHtml = JSON.stringify(algorithm.weights, null, 4);
      //email += "<p>"+weightsHtml+"</p>";
      email += "<h3>White and black lists</h3>";
      email += "<p>Author whitelist: "+JSON.stringify(algorithm.authorWhitelist)+"</p>";
      email += "<p>Author blacklist: "+JSON.stringify(algorithm.authorBlacklist)+"</p>";
      email += "<p>Content category whitelist: "+JSON.stringify(algorithm.contentCategoryWhitelist)+"</p>";
      email += "<p>Content category blacklist: "+JSON.stringify(algorithm.contentCategoryBlacklist)+"</p>";
      email += "<p>Content word whitelist: "+JSON.stringify(algorithm.contentWordWhitelist)+"</p>";
      email += "<p>Content word blacklist: "+JSON.stringify(algorithm.contentWordBlacklist)+"</p>";
      email += "<p>Domain whitelist: "+JSON.stringify(algorithm.domainWhitelist)+"</p>";
      email += "<p>Domain blacklist: "+JSON.stringify(algorithm.domainBlacklist)+"</p>";
      email += "<h3>Averaging window</h3>";
      // TODO : update this
      email += "<p>Averaging window size (in posts): "+NUM_POSTS_FOR_AVG_WINDOW+"</p>";
      email += "<p>Current score threshold: "+avgWindowInfo.scoreThreshold+"</p>";
      email += "<p>Percentage add to threshold: "+(SCORE_THRESHOLD_INC_PC*100)+"%</p>";
      email += "<p>Number of votes today: "+owner.num_votes_today+" + "+numVoteOn+" now = "+(owner.num_votes_today+numVoteOn)+"</p>";
      //email += "<p>Added to threshold to adjust for todays votes: "+avgWindowInfo.lastThresholdUpAdjust+"</p>";
      email += "<h3>Misc constant settings</h3>";
      email += "<p>Max posts to get: "+MAX_POST_TO_READ+"</p>";
      email += "<p>Dolpin min SP: "+CAPITAL_DOLPHIN_MIN+"</p>";
      email += "<p>Whale min SP: "+CAPITAL_WHALE_MIN+"</p>";
      email += "<p>Key detector, min keyword length: "+MIN_KEYWORD_LEN+"</p>";
      //email += "<h2>Raw results metadata:</h2>";
      //var metadataHtml = JSON.stringify(postsMetadata, null, 4);
      //email += "<p>"+metadataHtml+"</p>";
      email += "<h3>Process logs:</h3>";
      email += "<p>"+logHtml+"</p>";
      email += "</body></html>";
      sendEmail("Voter bot", email, true);
      persistString("last_log_html", email, function(err) {
        console.log("couldn't save last log html as persistent string");
      });
      return;
    }
  })
  .catch(function (err) {
    setError("stopped", false, err.message);
    if (callback) {
        callback(
          {
            status: 500, 
            message: "Error processing run bot: "+err.message,
            posts: postsMetadata
          });
      }
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
      console.log(err, result);
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
persistString(key, string):
*/
function persistString(key, string, error) {
  redisClient.on("error", function (err) {
    setError(null, false, "persistString redis error for key "+key+": "+err);
    if (error) {
      error();
    }
  });
  redisClient.set(key, string, function() {
    console.log("persistString save for key "+key);
  });
}

/*
getPersistentString(key):
*/
function getPersistentString(key, callback) {
  redisClient.on("error", function (err) {
    setError(null, false, "getPersistentString redis _on_ error for key "+key+": "+err);
  });
  redisClient.get(key, function(err, reply) {
    if (reply == null) {
      setError(null, false, "getPersistentString redis error for key "+key+": "+err);
      if (callback) {
        callback(null);
      }
    } else {
      if (callback) {
        try {
          callback(reply);
        } catch(err) {
          callback(null);
        }
      }
    }
  });
}

/*
persistJson(key, json):
*/
function persistJson(key, json, error) {
  redisClient.on("error", function (err) {
    setError(null, false, "persistJson redis error for key "+key+": "+err);
    if (error) {
      error();
    }
  });
  var str = JSON.stringify(json);
  console.log("persistJson for key "+key+", has JSON as str: "+str);
  redisClient.set(key, str, function(err) {
    if (err) {
      setError(null, false, "persistJson redis error for key "+key+": "+err.message);
    } else {
      console.log("persistJson save for key "+key);
    }
  });
}

/*
getPersistentJson(key):
*/
function getPersistentJson(key, callback) {
  redisClient.on("error", function (err) {
    setError(null, false, "getPersistentJson redis _on_ error for key "+key+": "+err);
  });
  redisClient.get(key, function(err, reply) {
    if (reply == null) {
      setError(null, false, "getPersistentJson redis error for key "+key+": "+err);
      if (callback) {
        callback(null);
      }
    } else {
      if (callback) {
        console.log("getPersistentJson for key "+key+", raw: "+reply);
        try {
          var json = JSON.parse(reply);
          callback(json);
        } catch(err) {
          setError(null, false, "getPersistentJson redis error for key "+key+": "+err.message);
          callback(null);
        }
      }
    }
  });
}

/*
updateWeightMetric(query, apiKey, callback):
* update weight metric
*/
function updateWeightMetric(query, apiKey, callback) {
  console.log("updateWeightMetric call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  if (metricKeys.indexOf(query.key) < 0) {
    if (callback) {
      callback({status: 500, message: "key "+query.key+" not valid"});
    }
    return;
  }
  getPersistentJson("algorithm", function(algorithmResult) {
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - updated algorithm from redis store: "+JSON.stringify(algorithm));
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
    persistJson("algorithm", algorithm, null);
    if (callback) {
      callback({status: 200, message: "Added key to algorithm: "+query.key});
    }
  });
}

/*
deleteWeightMetric(index, apiKey, callback):
* update weight metric
*/
function deleteWeightMetric(key, apiKey, callback) {
  console.log("deleteWeightMetric call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  getPersistentJson("algorithm", function(algorithmResult) {
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - updated algorithm from redis store: "+JSON.stringify(algorithm));
    }
    var newWeights = [];
    for (var i = 0 ; i < algorithm.weights.length ; i++) {
      if (algorithm.weights[i].key.localeCompare(key) != 0) {
        newWeights.push(algorithm.weights[i]);
      } // else don't add, effectively delete
    }
    algorithm.weights = newWeights;
    persistJson("algorithm", algorithm, null);
    if (callback) {
      callback({status: 200, message: "Removed key from algorithm: "+key});
    }
  });
}

/*
updateMetricList(list, contents, apiKey, callback):
* update weight metric
*/
function updateMetricList(list, contents, apiKey, callback) {
  console.log("updateMetricList call");
  if (apiKey.localeCompare(process.env.BOT_API_KEY) != 0) {
    if (callback) {
      callback({status: 500, message: "API key is incorrect"});
    }
    return;
  }
  // format contents
  var parts = S(contents.replace("  ", " ")).splitLeft(" ");
  getPersistentJson("algorithm", function(algorithmResult) {
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - updated algorithm from redis store: "+JSON.stringify(algorithm));
    }
    algorithm[list] = parts;
    persistJson("algorithm", algorithm, null);
    if (callback) {
      callback({status: 200, message: "Updated black / white list: "+list});
    }
  });
}

function savePostsMetadata(postsMetadataObj, callback) {
  console.log("savePostsMetadata");
  redisClient.get("postsMetadata_keys", function(err, keys) {
    var toKeep = [];
    if (err || keys == null) {
      console.log(" - postsMetadata_keys doesn't exist, probably first time run, will create newly");
    } else {
      var keysObj = JSON.parse(keys);
      console.log(" - removing old keys");
      // mark old keys for deletion, to clear space before saving
      var toDelete = [];
      for (var i = 0 ; i < keysObj.keys.length ; i++) {
        if (((new Date()).getTime() - keysObj.keys[i].date) > (DAYS_KEEP_LOGS * MILLIS_IN_DAY)) {
          toDelete.push(keysObj.keys[i].key);
        } else {
          toKeep.push(keysObj.keys[i]);
        }
      }
      console.log(" - - keeping "+toKeep.length+" keys");
      console.log(" - - deleting "+toDelete.length+" keys");
      redisClient.del(toDelete, function(err, delResult) {
        if (err || delResult < 1) {
          console.log(" - - - COULDNT delete redis keys: "+JSON.stringify(toDelete))
        } else {
          console.log(" - - - deleted redis keys: "+JSON.stringify(toDelete));
        }
      });
    }
    var stringifiedJson = JSON.stringify(postsMetadataObj);
    var key = extra.calcMD5(stringifiedJson);
    console.log(" - adding new postsMetadata key: "+key);
    toKeep.push({date: (new Date()).getTime(), key: key});
    redisClient.set("postsMetadata_keys", JSON.stringify({keys: toKeep}), function(err, setResult1) {
      if (err) {
        console.log("savePostsMetadata, error setting updated keys: "+err.message);
        callback({status: 500, message: "savePostsMetadata, error setting updated keys: "+err.message});
        return;
      }
      console.log(" - adding new postsMetadata under key: "+key);
      redisClient.set(key, stringifiedJson, function(err, setResult2) {
        if (err) {
          console.log("savePostsMetadata, error setting new object with key: "+err.message);
          callback({status: 500, message: "savePostsMetadata, error setting new object with key: "+err.message});
          return;
        }
        console.log(" - finished saving postsMetadata");
        callback({status: 200, message: "savePostsMetadata, success, saved postsMetadata with key: "+key});
      });
    });
  });
}

function getPostsMetadataKeys(callback) {
  console.log("getPostsMetadataKeys");
  console.log(" - getting keys");
  redisClient.get("postsMetadata_keys", function(err, keys) {
    if (err) {
      console.log("getPostsMetadataKeys, error: "+err.message);
      callback({status: 500, message: "getPostsMetadataKeys, error: "+err.message}, []);
    } else if (keys == null) {
      console.log("getPostsMetadataKeys, error: no result");
      callback({status: 500, message: "getPostsMetadataKeys, error: no result"}, []);
    } else {
      console.log(" - parsing keys");
      var keysObj = JSON.parse(keys);
      console.log(" - returning keys");
      callback(null, keysObj.keys);
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
  console.log("sendEmail to:"+process.env.EMAIL_ADDRESS_TO+", subject: "+subject);
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
	sg.API(request, function(err, response) {
    if (err) {
      console.log(" - error sending email: "+err.message);
    } else {
      console.log(" - send email, status: "+response.statusCode);
      
    }
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

  console.log("SendGrid API key?: "+(process.env.SENDGRID_API_KEY ? "true" : "false"));
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
module.exports.persistJson = persistJson;
module.exports.getPersistentJson = getPersistentJson;
module.exports.getPersistentString = getPersistentString;
module.exports.updateWeightMetric = updateWeightMetric;
module.exports.deleteWeightMetric = deleteWeightMetric;
module.exports.updateMetricList = updateMetricList;
module.exports.getPostsMetadataKeys = getPostsMetadataKeys;
module.exports.getEpochMillis = getEpochMillis;