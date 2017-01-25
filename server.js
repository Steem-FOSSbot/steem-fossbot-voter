'use strict';

const
  lib = require("./lib.js"),
  express = require("express"),
  expressSession = require('express-session'),
  path = require("path"),
  bodyParser = require("body-parser"),
  cookieParser = require('cookie-parser'),
  Cookies = require('cookies'),
  fs = require('fs'),
  redis = require("redis"),
  redisClient = require('redis').createClient(process.env.REDIS_URL),
  wait = require('wait.for'),
  extra = require('./extra.js'),
  moment_tz = require('moment-timezone'),
  moment = require('moment');

var cookieSessionKey = "";

var html_algo_emptyList = "<tr><td>None</td><td></td><td>-</td><td>-</td><th><p><a class=\"btn btn-default\" href=\"#\" role=\"button\"><strike>Delete<strike></a></p></th></tr>";
var html_test_emptyList = "<tr><td>None</td><td>-</td>-<td></tr>";

var
  html_msgPage1 = "",
  html_msgPage2 = "",
  html_msgPage3 = "",
  html_dashboard1 = "",
  html_dashboard2 = "",
  html_dashboard3 = "",
  html_editAlgo1 = "",
  html_editAlgo2 = "",
  html_editAlgo3 = "",
  html_editAlgo4 = "",
  html_testAlgo1 = "",
  html_testAlgo2 = "",
  html_last_log1 = "",
  html_last_log2 = "",
  html_stats1 = "",
  html_stats2 = "",
  html_stats3 = "",
  html_stats_run1 = "",
  html_stats_run2 = "",
  html_stats_run3 = "",
  html_stats_run4 = "";

var
  html_msg_api_err_body = "API key was not correct.<br/>If you are the owner, please check or re-issue your key.<br/>If you do not have access to this service, please contact the owner.<br/><br/>You might need to supply your API key again in at the <a href=\"/\">Dashboard</a>",
  html_msg_run_bot_body = "Bot successfully run.<br/>The votes will take a few seconds to be cast and registered on Steemit because of cast limiting.<br/>You can check the logs in a few minutes or wait for the email if you have set that up.";

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
// set up cookies and session
app.use(cookieParser());
app.use(expressSession({secret: process.env.COOKIE_SECRET}));

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  lib.initSteem();
  if (!lib.hasFatalError()) {
    console.log("Dashboard min requirements met, will be active on HTTPS");
    loadFiles();
  } else {
    // kill node server to stop dashboard from showing and let owner know there is a problem without
    // giving any information away
    process.exit();
  }
});

module.exports = app;

// Utils
function createMsgPageMessage(title, message) {
  return "<h1>"+title+"</h1><p class=\"lead\">"+message+"</p>";
}

function createMsgPageHTML(title, message) {
  return html_msgPage1
    + title + " - Voter"
    + html_msgPage2
    + createMsgPageMessage(title, message)
    + html_msgPage3;
}

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason + ", MESSAGE: "+message);
  res.status(code || 500).send(createMsgPageHTML("API error", html_msg_api_err_body + "<br/><br/>Details: "+message));
}

function handleErrorJson(res, reason, message, code) {
  console.log("JSON ERROR: " + reason + ", MESSAGE: "+message);
  var status = code || 500;
  res.json({status:status, error: reason, message: message});
}

function loadFiles() {
  loadFileToString("/html/msg-page-1.html", function(str) {
    html_msgPage1 = str;
    console.log("got /html/msg-page-1.html from file");
  });
  loadFileToString("/html/msg-page-2.html", function(str) {
    html_msgPage2 = str;
    console.log("got /html/msg-page-2.html from file");
  });
  loadFileToString("/html/msg-page-3.html", function(str) {
    html_msgPage3 = str;
    console.log("got /html/msg-page-3.html from file");
  });
  loadFileToString("/html/dashboard-part-1.html", function(str) {
    html_dashboard1 = str;
    console.log("got /html/dashboard-part-1.html from file");
  });
  loadFileToString("/html/dashboard-part-2.html", function(str) {
    html_dashboard2 = str;
    console.log("got /html/dashboard-part-2.html from file");
  });
  loadFileToString("/html/dashboard-part-3.html", function(str) {
    html_dashboard3 = str;
    console.log("got /html/dashboard-part-3.html from file");
  });
  loadFileToString("/html/edit-algo-part-1.html", function(str) {
    html_editAlgo1 = str;
    console.log("got /html/edit-algo-part-1.html from file");
  });
  loadFileToString("/html/edit-algo-part-2.html", function(str) {
    html_editAlgo2 = str;
    console.log("got /html/edit-algo-part-2.html from file");
  });
  loadFileToString("/html/edit-algo-part-3.html", function(str) {
    html_editAlgo3 = str;
    console.log("got /html/edit-algo-part-3.html from file");
  });
  loadFileToString("/html/edit-algo-part-4.html", function(str) {
    html_editAlgo4 = str;
    console.log("got /html/edit-algo-part-4.html from file");
  });
  loadFileToString("/html/test-algo-part-1.html", function(str) {
    html_testAlgo1 = str;
    console.log("got /html/test-algo-part-1.html from file");
  });
  loadFileToString("/html/test-algo-part-2.html", function(str) {
    html_testAlgo2 = str;
    console.log("got /html/test-algo-part-2.html from file");
  });
  loadFileToString("/html/last-log-1.html", function(str) {
    html_last_log1 = str;
    console.log("got /html/last-log-1.html from file");
  });
  loadFileToString("/html/last-log-2.html", function(str) {
    html_last_log2 = str;
    console.log("got /html/last-log-2.html from file");
  });
  loadFileToString("/html/stats-1.html", function(str) {
    html_stats1 = str;
    console.log("got /html/stats-1.html from file");
  });
  loadFileToString("/html/stats-2.html", function(str) {
    html_stats2 = str;
    console.log("got /html/stats-2.html from file");
  });
  loadFileToString("/html/stats-3.html", function(str) {
    html_stats3 = str;
    console.log("got /html/stats-3.html from file");
  });
  loadFileToString("/html/stats-run-1.html", function(str) {
    html_stats_run1 = str;
    console.log("got /html/stats-run-1.html from file");
  });
  loadFileToString("/html/stats-run-2.html", function(str) {
    html_stats_run2 = str;
    console.log("got /html/stats-run-2.html from file");
  });
  loadFileToString("/html/stats-run-3.html", function(str) {
    html_stats_run3 = str;
    console.log("got /html/stats-run-3.html from file");
  });
  loadFileToString("/html/stats-run-4.html", function(str) {
    html_stats_run4 = str;
    console.log("got /html/stats-run-4.html from file");
  });
}

function loadFileToString(filename, callback) {
  fs.readFile(path.join(__dirname, filename), {encoding: 'utf-8'}, function(err,data) {
    var str = "";
    if (err) {
      console.log(err);
    } else {
      str = data;
    }
    if (callback) {
      callback(str);
    }
  });
}

function saveStringToFile(filename, str, callback) {
  fs.writeFile(path.join(__dirname, filename), str, function(err) {
    if (err) {
      console.log(err);
      callback({message: "cant save file: "+filename});
    } else {
      console.log("saveStringToFile successfully saved to file: "+filename);
      callback();
    }
  });
}

// public HTTPS interface

/*
* / [root]
*/
app.get("/", function(req, res) {
  var html = "";
  if (!req.session.api_key || req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    html = "<div class=\"jumbotron\"><p>Enter BOT_API_KEY, to select a section button below.</p> <form class=\"form-add\"><input type=\"password\" name=\"api_key\" id=\"input_api_key\" placeholder=\"Key\" required autofocus></form></div>";
  }
  var html_usercontent = "<a href=\"http://steemit.com/@"+process.env.STEEM_USER+"\" class=\"list-group-item\">"+process.env.STEEM_USER+" on Steemit</a>";
  res.send(200, 
      html_dashboard1
      + html
      + html_dashboard2
      + html_usercontent
      + html_dashboard3);
});

/*
* /stats
*/
app.get("/stats", function(req, res) {
  console.log("_startTime: "+req._startTime);
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  console.log("req.session.api_key = "+req.session.api_key);
  //res.send(createMsgPageHTML("Bot Stats", "No page here yet! Underconstruction"));
  lib.getPostsMetadataKeys(function(err, keys) {
    var html = "";
    if (err || keys == null || keys.length < 1) {
      //handleError(res, "/stats Unauthorized", "stats: can't get key list, or list is empty", 500);
      console.log("No keys for /stats");
      return;
    } else {
      var lastDay = -1;
      for (var i = (keys.length - 1) ; i >= 0 ; i--) {
        html += "<li><a href=\"/stats?pd_key="+keys[i].key+"&time="+keys[i].date+"\">"
        var dateTime = moment_tz.tz(keys[i].date, lib.TIME_ZONE);
        if (dateTime.date() != lastDay) {
          lastDay = dateTime.date();
          html += dateTime.format("MMM Do YYYY HH:mm");
        } else {
          html += " --- --- " + dateTime.format("HH:mm");
        }
        html += "</a></li>";
      }
    }
    if (req.query.pd_key) {
      redisClient.get(req.query.pd_key, function(err, postsMetadataStr) {
        if (err || postsMetadataStr == null) {
          handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: key "+req.query.pd_key+" could not be fetched", 500);
          return;
        }
        //console.log("/stats-data-json, for pd_key "+req.query.pd_key+", got object (as string): "+postsMetadata);
        var postsMetadataObj = JSON.parse(postsMetadataStr);
        var postsMetadata = postsMetadataObj.postsMetadata;
        var html_list = "";
        if (postsMetadata.length > 0) {
          for (var i = 0 ; i < postsMetadata.length ; i++) {
            html_list += "<tr><td><a href=\""+postsMetadata[i].url+"\">"+postsMetadata[i].title+"</a></td><td>"+postsMetadata[i].score+"</td>"
                + "<td>"+(postsMetadata[i].vote ? "YES" : "NO")+"</td></tr>";
          }
        } else {
          html_list = html_test_emptyList;
        }
        res.send(200,
          html_stats_run1 
          + html
          + html_stats_run2
          + (moment_tz.tz(Number(req.query.time), lib.TIME_ZONE).format("MMM Do YYYY HH:mm"))
          + html_stats_run3
          + html_list
          + html_stats_run4);
      });
    } else {
      res.send(200,
        html_stats1 
        + html
        + html_stats2
        + "<p>To see record and proof of voting, visit <a href=\"https://steemd.com/@"+process.env.STEEM_USER
            +"\">https://steemd.com/@"+process.env.STEEM_USER+"</a></p>"
        + html_stats3);
    }
  });
});

/*
* /stats
*/
app.get("/last-log", function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  lib.getPersistentString("last_log_html", function(logs) {
    var html_logs = createMsgPageHTML("Last log", "No logs yet, please run bot for first time!");
    if (logs != null) {
      html_logs = logs;
    }
    saveStringToFile("public/tmp-stats.html", html_logs, function(err) {
      if (err) {
        handleError(res, "can't save temp file", "/last-log: can't save temp file", 500);
      } else {
        res.send(200, 
          html_last_log1 
          + "/tmp-stats.html"
          + html_last_log2);
      }
    });
  });
});

app.get("/stats-data-json", function(req, res) {
  if (!req.query.api_key && !req.query.session_key) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: api_key or session_key not supplied", 401);
    return;
  } else if (req.query.api_key && req.query.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: api_key invalid", 401);
    return;
  } else if (req.query.session_key && req.query.session_key.localeCompare(cookieSessionKey) != 0) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: session_key invalid", 401);
    return;
  }
  if (req.query.pd_key) {
    redisClient.get(req.query.pd_key, function(err, postsMetadata) {
      if (err || postsMetadata == null) {
        handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: key "+req.query.pd_key+" could not be fetched", 500);
        return;
      }
      //console.log("/stats-data-json, for pd_key "+req.query.pd_key+", got object (as string): "+postsMetadata);
      var postsMetadataObj = JSON.parse(postsMetadata);
      res.json(postsMetadataObj);
      return;
    });
    return;
  }
  lib.getPostsMetadataKeys(function(err, keys) {
    if (err) {
      handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: no data in store, no keys", 500);
      return;
    }
    console.log(" - /stats-data-json got keys: "+JSON.stringify(keys));
    if (req.query.count_only) {
      res.json({num_keys: keys.length});
      return;
    }
    var justKeys = [];
    for (var i = 0 ; i < keys.length ; i++) {
      justKeys.push(keys[i].key);
    }
    recursiveGetPostsMetadata(justKeys, 0, function(resultList) {
      if (resultList == null || resultList.length < 1) {
        handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: error fetching data, no results for key fetch", 500);
      } else {
        var postsMetadataList = [];
        if (justKeys.length > 1) {
          var limit = resultList.length;
          if (req.query.limit) {
            limit = req.query.limit;
            if (limit < 1) {
              limit = 1;
            }
            if (limit > resultList.length) {
              limit = resultList.length;
            }
          }
          console.log("get num keys: "+limit+" of "+resultList.length);
          for (var i = 0 ; i < limit ; i++) {
            postsMetadataList.push(JSON.parse(resultList[i]));
          }
        } else {
          postsMetadataList.push(JSON.parse(resultList));
        }
        if (req.query.summary) {
          var summary = [];
          for (var i = 0 ; i < postsMetadataList.length ; i++) {
            var numVotes = 0;
            for (var j = 0 ; j < postsMetadataList[i].postsMetadata.length ; j++) {
              if (postsMetadataList[i].postsMetadata[j].vote) {
                numVotes++;
              }
            }
            var dateTime = moment_tz.tz(keys[i].date, lib.TIME_ZONE);
            summary.push({
              date: keys[i].date,
              date_str: (dateTime.format("MM/DD//YY HH:mm")),
              date_day: dateTime.date(),
              num_posts: postsMetadataList[i].postsMetadata.length,
              num_votes: numVotes
            });
          }
          console.log("Sending summary: "+JSON.stringify(summary));
          res.json({summary: summary});
        } else {
          res.json({postsMetadataList: postsMetadataList});
        }
      }
    }, []);
  });
});

function recursiveGetPostsMetadata(keys, index, callback, list) {
  redisClient.get(keys[index], function(err, result) {
    if (err || result == null) {
      callback(list);
      return;
    }
    list.push(result);
    index++;
    if (index >= keys.length) {
      callback(list);
      return;
    }
    recursiveGetPostsMetadata(keys, index, callback, list);
  });
}


app.get("/get-algo", function(req, res) {
  if (!req.query.api_key && !req.query.session_key) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: api_key or session_key not supplied", 401);
    return;
  } else if (req.query.api_key && req.query.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: api_key invalid", 401);
    return;
  } else if (req.query.session_key && req.query.session_key.localeCompare(cookieSessionKey) != 0) {
    handleError(res, "/stats-data-json Unauthorized", "stats-data-json: session_key invalid", 401);
    return;
  }
  lib.getPersistentJson("algorithm", function(algorithm) {
    console.log("attempted to get algorithm: "+algorithm);
    if (algorithm != null) {
      res.json(JSON.stringify(algorithm));
    } else {
      handleErrorJson(res, "/get-algo Unauthorized", "get-algo: no data in store", 500);
    }
  });
});

/*
 * /run-bot endpoint
 *
 * Starts an iteration of the bot
 *
 * Example usage:
 * /run-bot?api_key=1234
 *
 * optional json=true
 */
app.get("/run-bot", function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    if (obj) {
      if (req.query.json) {
        // return json directly
        res.status(obj.status).json(obj);
      } else {
        // default to show in logs (same as /stats endpoint)
        lib.getPersistentString("last_log_html", function(logs) {
          var html_logs = "<html><body><h1>No logs yet, please run bot for first time!</h1></body></html>";
          if (logs != null) {
            html_logs = logs;
          }
          saveStringToFile("public/tmp-stats.html", html_logs, function(err) {
            if (err) {
              handleError(res, "can't save temp file", "/stats: can't save temp file", 500);
            } else {
              res.status(200).send(
                createMsgPageHTML("Run bot success", html_msg_run_bot_body));
            }
          });
        });
      }
    } else {
      handleError(res, "/run-bot Internal error", "Run bot: Bot run failed internally, consult logs", 500);
    }
  });
});

/*
 * TO DELETE
 */
/*
app.get("/run-bot", function(req, res) {
  if (!req.query.api_key) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key not supplied", 401);
    return;
  } else if (req.query.api_key.localeCompare(process.env.BOT_API_KEY)) {
    handleError(res, "/run-bot Unauthorized", "Run bot: api_key invalid", 401);
    return;
  }
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    if (obj) {
      res.status(obj.status).json(obj);
    } else {
      handleError(res, "/run-bot Internal error", "Run bot: Bot run failed internally, consult logs", 500);
    }
  });
});
*/

// GET /edit-algo
app.get("/edit-algo", function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  if (req.query.delete) {
    lib.deleteWeightMetric(req.query.delete, process.env.BOT_API_KEY, function(result) {
      console.log("lib.deleteWeightMetric result: "+JSON.stringify(result));
      // show edit-algo as normal
      editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
    });
    return;
  }
  var str = "";
  var contents = "";
  if (req.query.author_whitelist) {
    str = "authorWhitelist";
    contents = req.query.author_whitelist;
  } else if (req.query.author_blacklist) {
    str = "authorBlacklist";
    contents = req.query.author_blacklist;
  } else if (req.query.content_category_whitelist) {
    str = "contentCategoryWhitelist";
    contents = req.query.content_category_whitelist;
  } else if (req.query.content_category_blacklist) {
    str = "contentCategoryBlacklist";
    contents = req.query.content_category_blacklist;
  } else if (req.query.content_word_whitelist) {
    str = "contentWordWhitelist";
    contents = req.query.content_word_whitelist;
  } else if (req.query.content_word_blacklist) {
    str = "contentWordBlacklist";
    contents = req.query.content_word_blacklist;
  } else if (req.query.domain_whitelist) {
    str = "domainWhitelist";
    contents = req.query.domain_whitelist;
  } else if (req.query.domain_blacklist) {
    str = "domainBlacklist";
    contents = req.query.domain_blacklist;
  }
  if (str.length > 0) {
    // update
    lib.updateMetricList(str, contents, process.env.BOT_API_KEY, function(result) {
      console.log("lib.updateMetricList result: "+JSON.stringify(result));
      // show edit-algo as normal
      editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
    });
    return;
  }
  editAlgoExec(res);  
});

// POST /edit-algo
app.post("/edit-algo", bodyParser.urlencoded({extended: false}), function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  console.log("/edit-algo POST request");
  // get options from post data
  console.log(" - req.body: "+JSON.stringify(req.body));
  if (req.body.json_algo) {
    // is update algorithm query
    console.log(" - check algorithm is valid");
    try {
      var parsed = JSON.parse(req.body.json_algo);
      for (var i = 0 ; i < parsed.weights.length ; i++) {
        if (!parsed.weights[i].hasOwnProperty("key")
            || !parsed.weights[i].hasOwnProperty("value")) {
          throw {message: "Parsed JSON does not have valid weights object at array index "+i};
        }
      }
      if (!parsed.hasOwnProperty("authorWhitelist")) {
        throw {message: "Parsed JSON does not have authorWhitelist array"};
      }
      if (!parsed.hasOwnProperty("authorBlacklist")) {
        throw {message: "Parsed JSON does not have authorBlacklist array"};
      }
      if (!parsed.hasOwnProperty("contentCategoryWhitelist")) {
        throw {message: "Parsed JSON does not have contentCategoryWhitelist array"};
      }
      if (!parsed.hasOwnProperty("contentCategoryBlacklist")) {
        throw {message: "Parsed JSON does not have contentCategoryBlacklist array"};
      }
      if (!parsed.hasOwnProperty("contentWordWhitelist")) {
        throw {message: "Parsed JSON does not have contentWordWhitelist array"};
      }
      if (!parsed.hasOwnProperty("contentWordBlacklist")) {
        throw {message: "Parsed JSON does not have contentWordBlacklist array"};
      }
      if (!parsed.hasOwnProperty("domainWhitelist")) {
        throw {message: "Parsed JSON does not have domainWhitelist array"};
      }
      if (!parsed.hasOwnProperty("domainBlacklist")) {
        throw {message: "Parsed JSON does not have domainBlacklist array"};
      }
    } catch(err) {
      handleError(res, "/edit-algo Unimplmented", "edit-algo: supplied JSON failed test: "+err.message, 401);
      return;
    }
    console.log(" - update algorithm");
    lib.persistJson("algorithm", JSON.parse(req.body.json_algo), function(err) {
      console.log(" - - ERROR SAVING algorithm");
      // TODO : show this on page
    });
    editAlgoExec(res, "<h2 class=\"sub-header\">Imported algorithm</h2>");  
    return;
  }
  // create query
  var query = {
    key: req.body.key,
    value: req.body.weight
  };
  if (req.body.lower) {
    query["lower"] = req.body.lower;
  }
  if (req.body.upper) {
    query["upper"] = req.body.upper;
  }
  // update
  lib.updateWeightMetric(query, process.env.BOT_API_KEY, function(result) {
    console.log("lib.updateWeightMetric result: "+JSON.stringify(result));
    // show edit-algo as normal
    editAlgoExec(res, "<h2 class=\"sub-header\">"+result.message+"</h2>");  
  });
});

function editAlgoExec(res, message) {
  lib.getPersistentJson("algorithm", function(algorithmResult) {
    var algorithm = {};
    if (algorithmResult != null) {
      algorithm = algorithmResult;
      console.log(" - got algorithm from redis store: "+JSON.stringify(algorithm));
    } else {
      console.log(" - no algorithm in redis store, USING DEFAULT");
      // TODO : remove this default algorithm setting
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
    var html_whiteblacklists = "";
    //author_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"author_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.authorWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.authorWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Author whitelist</button></form></div>";
    //author_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"author_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.authorBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.authorBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Author blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //content_category_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_category_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentCategoryWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentCategoryWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Category and Tag whitelist</button></form></div>";
    //content_category_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_category_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentCategoryBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentCategoryBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Category and Tag blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //content_word_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_word_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentWordWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentWordWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Word whitelist</button></form></div>";
    //content_word_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"content_word_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.contentWordBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.contentWordBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Content Word blacklist</button></form></div>";
    html_whiteblacklists += "</div><div class=\"row\">";
    //domain_whitelist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"domain_whitelist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.domainWhitelist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.domainWhitelist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Domain whitelist</button></form></div>";
    //domain_blacklist
    html_whiteblacklists += "<div class=\"col-sm-4\"><form class=\"form-list\" action=\"/edit-algo\"><label for=\"inputKey\" class=\"sr-only\"></label>";
    html_whiteblacklists += "<textarea name=\"domain_blacklist\" cols=\"60\" rows=\"3\">";
    for (var i = 0 ; i < algorithm.domainBlacklist.length ; i++) {
      html_whiteblacklists += ((i > 0) ? " " : "") + algorithm.domainBlacklist[i];
    }
    html_whiteblacklists += "</textarea><button class=\"btn btn-lg btn-primary btn-block\" type=\"submit\" value=\"POST\">Update Domain blacklist</button></form></div>";

    console.log(" - algorithm: "+JSON.stringify(algorithm));
    var html_list = "";
    if (algorithm.weights.length > 0) {
      for (var i = 0 ; i < algorithm.weights.length ; i++) {
        html_list += "<tr><td><a href=\"javascript:selectKey(\'"+algorithm.weights[i].key+"\', "+algorithm.weights[i].value;
        if (algorithm.weights[i].hasOwnProperty("lower")) {
          html_list += ", "+algorithm.weights[i].lower;
          if (!algorithm.weights[i].hasOwnProperty("upper")) {
            html_list += ", 0";
          }
        }
        if (algorithm.weights[i].hasOwnProperty("upper")) {
          html_list += ", "+algorithm.weights[i].upper;
        }
        html_list += ")\">"+algorithm.weights[i].key+"</a></td><td>"+algorithm.weights[i].value+"</td>";
        if (algorithm.weights[i].hasOwnProperty("lower")) {
          html_list += "<td>"+algorithm.weights[i].lower+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        if (algorithm.weights[i].hasOwnProperty("upper")) {
          html_list += "<td>"+algorithm.weights[i].upper+"</td>";
        } else {
          html_list += "<td>-</td>";
        }
        // TODO : add href url delete to button
        html_list += "<th><p><a class=\"btn btn-default\" role=\"button\" href=\"javascript:deleteMetric(\'"+algorithm.weights[i].key+"\')\">Delete</a></p></th>";
        html_list += "</tr>";
      }
    } else {
      html_list = html_algo_emptyList;
    }
    // send back response
    res.send(200, 
      html_editAlgo1
      + (message ? message : "")
      + html_editAlgo2
      + html_list
      + html_editAlgo3
      + html_whiteblacklists
      + html_editAlgo4);
    });
}

// GET /edit-algo
app.get("/test-algo", function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  // check for options from query data
  if (req.query.limit) {
    testAlgoExec(res, {test: true, limit: 5});
  } else {
    res.send(200, 
      html_testAlgo1
      + html_test_emptyList
      + html_testAlgo2
      );
  }
});

// POST /edit-algo
app.post("/test-algo", bodyParser.urlencoded({extended: false}), function(req, res) {
  console.log("req.query.api_key = "+req.query.api_key);
  console.log("req.session.api_key = "+req.session.api_key);
  if (req.query.api_key) {
    req.session.api_key = req.query.api_key;
    var cookies = new Cookies(req, res);
    if (cookieSessionKey.length < 1) {
      cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
    }
    console.log("created session_key cookie for client: "+cookieSessionKey);
    cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
    console.log("check cookie for session_key: "+cookies.get("session_key"));
  } else if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  console.log("/test-algo POST request: "+req);
  if (req.body.author && req.body.permlink) {
    testAlgoExec(res, {test: true, author: req.body.author, permlink: req.body.permlink});
  } else {
    res.send(200, 
      html_testAlgo1
      + html_testAlgo2
      );
  }
});

function testAlgoExec(res, options) {
  lib.runBot(function(obj) {
    console.log("lib.runBot returned: " + JSON.stringify(obj));
    var postsMetadata = [];
    if (obj && obj.status == 200) {
      postsMetadata = obj.posts;
    }
    // build list
    var html_list = "";
    if (postsMetadata.length > 0) {
      for (var i = 0 ; i < postsMetadata.length ; i++) {
        html_list += "<tr><td><a href=\""+postsMetadata[i].url+"\">"+postsMetadata[i].title+"</a></td><td>"+postsMetadata[i].score+"</td>"
            + "<td>"+(postsMetadata[i].vote ? "YES" : "NO")+"</td></tr>";
      }
    } else {
      html_list = html_test_emptyList;
    }
    res.send(200, 
      html_testAlgo1
      + html_list
      + html_testAlgo2
      );
  }, options);
}