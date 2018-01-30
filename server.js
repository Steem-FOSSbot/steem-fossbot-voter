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
  wait = require('wait.for'),
  extra = require('./extra.js'),
  moment_tz = require('moment-timezone'),
  moment = require('moment'),
  atob = require('atob');

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
  html_dashboard4 = "",
  html_editAlgo1 = "",
  html_editAlgo2 = "",
  html_editAlgo3 = "",
  html_editAlgo4 = "",
  html_testAlgo1 = "",
  html_testAlgo2 = "",
  html_stats1 = "",
  html_stats2 = "",
  html_stats3 = "",
  html_stats_run1 = "",
  html_stats_run2 = "",
  html_stats_run3 = "",
  html_stats_run4 = "",
  html_stats_daily_likes_3 = "",
  html_stats_daily_likes_4 = "",
  html_edit_config1 = "",
  html_edit_config2 = "";

var
  json_package = "";

var
  html_msg_api_err_body = "API key was not correct.<br/>If you are the owner, please check or re-issue your key.<br/>If you do not have access to this service, please contact the owner.<br/><br/>You might need to supply your API key again in at the <a href=\"/\">Dashboard</a>",
  html_msg_run_bot_body = "The processing and votes will take a few" +
    " minutes to be cast and registered on Steemit because of the" +
    " processing time and Steemit vote cast limiting.<br/>You can check" +
    " the stats and logs in a few minutes to see the results.";

var app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
// set up cookies and session
app.use(cookieParser());
app.use(expressSession({
  secret: process.env.COOKIE_SECRET,
  resave: true,
  saveUninitialized: true
}));

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  lib.initLib(false, function() {
    loadFiles();
  });
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

function handleErrorJson(res, reason, message, code, payload) {
  console.log("JSON ERROR: " + reason + ", MESSAGE: "+message);
  var status = code || 500;
  if (payload) {
    res.json({status:status, error: reason, message: message, payload: payload});
  } else {
    res.json({status:status, error: reason, message: message});
  }
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
  loadFileToString("/html/dashboard-part-4.html", function(str) {
    html_dashboard4 = str;
    console.log("got /html/dashboard-part-4.html from file");
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
  loadFileToString("/html/stats-daily-likes-3.html", function(str) {
    html_stats_daily_likes_3 = str;
    console.log("got /html/stats-daily-likes-3.html from file");
  });
  loadFileToString("/html/stats-daily-likes-4.html", function(str) {
    html_stats_daily_likes_4 = str;
    console.log("got /html/stats-daily-likes-4.html from file");
  });
  loadFileToString("/html/edit-config-1.html", function(str) {
    html_edit_config1 = str;
    console.log("got /html/edit-config-1.html from file");
  });
  loadFileToString("/html/edit-config-2.html", function(str) {
    html_edit_config2 = str;
    console.log("got /html/edit-config-2.html from file");
  });
  // JSON
  loadFileToString("/package.json", function(str) {
    try {
      json_package = JSON.parse(str);
    } catch(err) {
      json_package = {version: "unknown"};
    }
    console.log("got /package.json from file");
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
  dashboardExec(req, res);
});

app.post("/", bodyParser.urlencoded({extended: false}), function(req, res) {
  if (!req.body.api_key) {
    handleError(res, "/stats Unauthorized", "stats: no api key supplied", 401);
    return;
  } else if (req.body.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "stats: api key is incorrect", 401);
    return;
  }
  req.session.api_key = req.body.api_key;
  var cookies = new Cookies(req, res);
  if (cookieSessionKey.length < 1) {
    cookieSessionKey = extra.calcMD5("" + (Math.random() * 7919));
  }
  console.log("created session_key cookie for client: "+cookieSessionKey);
  cookies.set("session_key", cookieSessionKey, {overwrite: true, httpOnly: false});
  console.log("check cookie for session_key: "+cookies.get("session_key"));
  dashboardExec(req, res);
});

function dashboardExec(req, res) {
  var html = "";
  var html_usercontent = "";
  var html_version = "<h3>version "+json_package.version+"</h3>";
  if (!req.session.api_key || req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    html += "<div class=\"jumbotron jumbotron_col\"><p>Enter BOT_API_KEY here and section using the buttons below.</p>" +
      "<form class=\"form-add\" action=\"/\" method=\"post\"><input type=\"password\" name=\"api_key\" id=\"input_api_key\" placeholder=\"Key\" required autofocus>" +
      "<button class=\"btn btn-primary button_form_spacing\" type=\"submit\" value=\"POST\">Start Session</button>" +
      "</form></div>";
  } else {
    html += "<div class=\"jumbotron jumbotron_col jumbotron_smaller\"><p>Session is valid, dashboard active</p></div>";
    if (process.env.STEEM_USER && process.env.STEEM_USER.length > 0) {
      html_usercontent = "<a href=\"http://steemit.com/@"+process.env.STEEM_USER+"\" class=\"list-group-item\">"+process.env.STEEM_USER+" on Steemit</a>";
      html_usercontent += "<a href=\"http://steemd.com/@"+process.env.STEEM_USER+"\" class=\"list-group-item\">"+process.env.STEEM_USER+" detailed data</a>";
    }
  }
  res.status(200).send(
    html_dashboard1
    + html_version
    + html_dashboard2
    + html
    + html_dashboard3
    + html_usercontent
    + html_dashboard4);
}

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
  execStats(req, res);
});

function execStats(req, res) {
  lib.getPostsMetadataAllDates(function(err, dates) {
    var html = "";
    if (err || dates === null || dates.length < 1) {
      res.status(200).send(
        createMsgPageHTML("No stats available", "It looks like this is a fresh install of Voter. Please generate some stats by using it and then come back here to see the results in detail.")
      );
      console.log("No keys for /stats");
      return;
    } else {
      var lastDay = -1;
      for (var i = (dates.length - 1) ; i >= 0 ; i--) {
        var dateTime = moment_tz.tz(Number(dates[i]), lib.getConfigVars().TIME_ZONE);
        if (dateTime.date() !== lastDay) {
          lastDay = dateTime.date();
          // add spacer and then day over list item first
          html += "<li></li><li><a href=\"/stats?date_str="+dateTime.format("MM-DD-YYYY")+"\">"+
            "Votes for " + dateTime.format("MMM Do YYYY") + "</a></li>";
        }
        html += "<li><a href=\"/stats?save_date="+dates[i]+"\">" +
          " --- --- " + dateTime.format("HH:mm") + "</a></li>";
      }
    }
    if (req.query.date_str) {
      lib.getDailyLikedPosts(req.query.date_str, function(err, dailyLikedPostsResults) {
        if (err) {
          res.status(200).send(
            createMsgPageHTML("Stats", "No data for daily liked posts, there may be an internal data inconsistency or corrupt key (err stage 1)"));
        } else {
          var thisDate = moment(req.query.date_str); // TODO : fix this parsing, soon to be deprecated
          var html_header = "";
          if (dailyLikedPostsResults === null) {
            // #58, no votes cast today, is not system failure, display meaningful message
            html_header = "No votes cast on " + (thisDate.format("MMM Do YYYY"));
            html_list = html_test_emptyList;
          } else {
            html_header = "Votes cast on " + (thisDate.format("MMM Do YYYY"));
            var postsMetadata = dailyLikedPostsResults.posts;
            var html_list = "";
            if (postsMetadata.length > 0) {
              for (var i = 0 ; i < postsMetadata.length ; i++) {
                html_list += "<tr><td><a href=\""+postsMetadata[i].url+"\">"+postsMetadata[i].title+"</a></td><td>"+postsMetadata[i].score+"</td>"
                  + "<td>"+(postsMetadata[i].vote ? "YES" : "NO")+"</td></tr>";
              }
            } else {
              html_list = html_test_emptyList;
            }
          }
          res.status(200).send(
            html_stats_run1
            + html
            + html_stats_run2
            + html_header
            + html_stats_daily_likes_3
            + html_list
            + html_stats_daily_likes_4);
        }
      });
    } else if (req.query.save_date) {
      lib.getPostsMetadataList(req.query.save_date, function(err, postsMetadataList) {
        if (err || postsMetadataList === null) {
          handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: key "+req.query.save_date+" could not be fetched", 500);
          return;
        }
        var html_list = "";
        if (postsMetadataList.length > 0) {
          for (var i = 0 ; i < postsMetadataList.length ; i++) {
            html_list += "<tr><td><a href=\""+postsMetadataList[i].url+"\">"+postsMetadataList[i].title+"</a></td><td>"+postsMetadataList[i].score+"</td>"
              + "<td>"+(postsMetadataList[i].vote ? "YES" : "NO")+"</td></tr>";
          }
        } else {
          html_list = html_test_emptyList;
        }
        res.status(200).send(
          html_stats_run1
          + html
          + html_stats_run2
          + "Bot run details for run at " + (moment_tz.tz(Number(req.query.save_date), lib.getConfigVars().TIME_ZONE).format("MMM Do YYYY HH:mm"))
          + html_stats_run3
          + html_list
          + html_stats_run4);
      });
    } else {
      res.status(200).send(
        html_stats1
        + html
        + html_stats2
        + "<p>To see record and proof of voting, visit <a href=\"https://steemd.com/@"+process.env.STEEM_USER
        +"\">https://steemd.com/@"+process.env.STEEM_USER+"</a></p>"
        + html_stats3);
    }
  });
}

/*
* /stats
*/

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
  if (req.query.save_date) {
    lib.getPostsMetadataList(req.query.save_date, function(err, postsMetadataList) {
      if (err || postsMetadataList === undefined || postsMetadataList === null) {
        handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: key "+req.query.save_date+" could not be fetched", 500);
        return;
      }
      res.json({list: postsMetadataList});
    });
    return;
  } else if (req.query.summary) {
    lib.getPostsMetadataSummary(function (summary) {
      console.log("Sending summary: "+JSON.stringify(summary));
      res.json({summary: summary});
    });
  } else if (req.query.count_only) {
    lib.getPostsMetadataAllDates(function(err, dates) {
      if (err || dates === undefined || dates === null) {
        handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: no data in store, no keys", 500);
        return;
      }
      console.log(" - /stats-data-json dates: "+JSON.stringify(dates));
      res.json({num_keys: dates.length});
    });
  } else {
    handleErrorJson(res, "/stats-data-json Server error", "stats-data-json: no query", 500);
  }
});

app.get("/get-config-vars", function(req, res) {
  if (!req.query.api_key && !req.query.session_key) {
    handleErrorJson(res, "/stats-data-json Unauthorized", "stats-data-json: api_key or session_key not supplied", 401, "1");
    return;
  } else if (req.query.api_key && req.query.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleErrorJson(res, "/stats-data-json Unauthorized", "stats-data-json: api_key invalid", 401, "2");
    return;
  } else if (req.query.session_key && req.query.session_key.localeCompare(cookieSessionKey) != 0) {
    handleErrorJson(res, "/stats-data-json Unauthorized", "stats-data-json: session_key invalid", 401, "3");
    return;
  }
  var config = lib.getConfigVars();
  delete config["_id"];
  res.json(config);
});

/*
function recursiveGetPostsMetadata(keys, index, callback, list) {
  redisClient.get(keys[index], function(err, result) {
    index++;
    if (index > keys.length) {
      callback(list);
      return;
    }
    if (err || result === null) {
      recursiveGetPostsMetadata(keys, index, callback, list);
    } else {
      list.push(result);
      recursiveGetPostsMetadata(keys, index, callback, list);
    }
  });
}
*/


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
  lib.getPersistentObj(lib.DB_ALGORITHM, function(err, algorithm) {
    console.log("attempted to get algorithm: "+algorithm);
    if (algorithm != null) {
      delete algorithm["_id"];
      res.json(JSON.stringify(algorithm));
    } else if (err || algorithm === undefined || algorithm === null) {
      handleErrorJson(res, "/get-algo Server error", "get-algo: no data in store", 500);
    }
  });
});

app.get("/get-daily-liked-posts", function(req, res) {
  if (!req.query.api_key && !req.query.session_key) {
    handleError(res, "/get-daily-liked-posts Unauthorized", "get-daily-liked-posts: api_key or session_key not supplied", 401);
    return;
  } else if (req.query.api_key && req.query.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/get-daily-liked-posts Unauthorized", "get-daily-liked-posts: api_key invalid", 401);
    return;
  } else if (req.query.session_key && req.query.session_key.localeCompare(cookieSessionKey) != 0) {
    handleError(res, "/get-daily-liked-posts Unauthorized", "get-daily-liked-posts: session_key invalid", 401);
    return;
  }
  var query = null;
  if (req.query.date_str) {
    query = req.query.date_str;
  }
  lib.getDailyLikedPosts(query, function(err, dailyLikedPostsResults) {
    if (err
        || dailyLikedPostsResults === undefined
        || dailyLikedPostsResults === null) {
      handleErrorJson(res, "/get-daily-liked-posts Server error", "get-daily-liked-posts: no data in store", 500);
    } else {
      console.log("got daily_liked_posts");
      res.json(dailyLikedPostsResults);
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
  lib.getPersistentObj(lib.DB_ALGORITHM, function(err, algo) {
    if (err || algo === null) {
      res.status(200).send(
        createMsgPageHTML("Run Bot", "Algorithm is not yet set!<br/>Go to <strong>Edit Algo</strong> from the dashboard to create it."));
      return;
    }
    // #86, fork this process to start bot via bot.js, same as scheduled
    // method
    var fork = require('child_process').fork;
    var child = fork('./bot.js');
    res.status(200).send(
      createMsgPageHTML("Bot script started.", html_msg_run_bot_body));
  });
});

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
  if (req.query.author_whitelist !== undefined) {
    str = "authorWhitelist";
    contents = req.query.author_whitelist;
  } else if (req.query.author_blacklist !== undefined) {
    str = "authorBlacklist";
    contents = req.query.author_blacklist;
  } else if (req.query.content_category_whitelist !== undefined) {
    str = "contentCategoryWhitelist";
    contents = req.query.content_category_whitelist;
  } else if (req.query.content_category_blacklist !== undefined) {
    str = "contentCategoryBlacklist";
    contents = req.query.content_category_blacklist;
  } else if (req.query.content_word_whitelist !== undefined) {
    str = "contentWordWhitelist";
    contents = req.query.content_word_whitelist;
  } else if (req.query.content_word_blacklist !== undefined) {
    str = "contentWordBlacklist";
    contents = req.query.content_word_blacklist;
  } else if (req.query.domain_whitelist !== undefined) {
    str = "domainWhitelist";
    contents = req.query.domain_whitelist;
  } else if (req.query.domain_blacklist !== undefined) {
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
    lib.persistObj(lib.DB_ALGORITHM, JSON.parse(req.body.json_algo), function(err) {
      if (err) {
        console.log(" - - ERROR SAVING algorithm");
        // TODO : show this on page
      }
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
  lib.getPersistentObj(lib.DB_ALGORITHM, function(err, algorithmResult) {
    var algorithm = {};
    if (err || algorithmResult === undefined || algorithmResult === null) {
      console.log(" - no algorithm in db, USING DEFAULT");
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
    } else {
      algorithm = algorithmResult;
      console.log(" - got algorithm from db: "+JSON.stringify(algorithm));
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
    res.status(200).send(
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
    res.status(200).send(
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
    res.status(200).send(
      html_testAlgo1
      + html_testAlgo2
      );
  }
});

function testAlgoExec(res, options) {
  lib.runBot(function(obj) {
    var postsMetadata = [];
    if (obj !== undefined && obj !== null) {
      postsMetadata = obj;
      console.log("lib.runBot returned valid results");
    } else {
      console.log("lib.runBot returned invalid results");
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
    res.status(200).send(
      html_testAlgo1
      + html_list
      + html_testAlgo2
      );
  }, options);
}

app.get("/edit-config", function(req, res) {
  var configVars = lib.getConfigVars();
  var change = false;
  var html_title = "<h3 class=\"sub-header\">";
  if (req.query.MAX_VOTES_IN_24_HOURS) {
    // nothing
  } else if (req.query.MIN_POST_AGE_TO_CONSIDER) {
    configVars.MIN_POST_AGE_TO_CONSIDER = Number(atob(req.query.MIN_POST_AGE_TO_CONSIDER));
    change = true;
    html_title += "Updated MIN_POST_AGE_TO_CONSIDER";
  } else if (req.query.MAX_POST_TO_READ) {
    configVars.MAX_POST_TO_READ = Number(atob(req.query.MAX_POST_TO_READ));
    change = true;
    html_title += "Updated MAX_POST_TO_READ";
  } else if (req.query.MIN_WORDS_FOR_ARTICLE) {
    configVars.MIN_WORDS_FOR_ARTICLE = Number(atob(req.query.MIN_WORDS_FOR_ARTICLE));
    change = true;
    html_title += "Updated MIN_WORDS_FOR_ARTICLE";
  } else if (req.query.NUM_POSTS_FOR_AVG_WINDOW) {
    configVars.NUM_POSTS_FOR_AVG_WINDOW = Number(atob(req.query.NUM_POSTS_FOR_AVG_WINDOW));
    change = true;
    html_title += "Updated NUM_POSTS_FOR_AVG_WINDOW";
  } else if (req.query.MIN_SCORE_THRESHOLD) {
    configVars.MIN_SCORE_THRESHOLD = Number(atob(req.query.MIN_SCORE_THRESHOLD));
    change = true;
    html_title += "Updated MIN_SCORE_THRESHOLD";
  } else if (req.query.SCORE_THRESHOLD_INC_PC) {
    configVars.SCORE_THRESHOLD_INC_PC = Number(atob(req.query.SCORE_THRESHOLD_INC_PC));
    change = true;
    html_title += "Updated SCORE_THRESHOLD_INC_PC";
  } else if (req.query.CAPITAL_DOLPHIN_MIN) {
    configVars.CAPITAL_DOLPHIN_MIN = Number(atob(req.query.CAPITAL_DOLPHIN_MIN));
    change = true;
    html_title += "Updated CAPITAL_DOLPHIN_MIN";
  } else if (req.query.CAPITAL_WHALE_MIN) {
    configVars.CAPITAL_WHALE_MIN = Number(atob(req.query.CAPITAL_WHALE_MIN));
    change = true;
    html_title += "Updated CAPITAL_WHALE_MIN";
  } else if (req.query.MIN_KEYWORD_LEN) {
    configVars.MIN_KEYWORD_LEN = Number(atob(req.query.MIN_KEYWORD_LEN));
    change = true;
    html_title += "Updated MIN_KEYWORD_LEN";
  } else if (req.query.DAYS_KEEP_LOGS) {
    configVars.DAYS_KEEP_LOGS = Number(atob(req.query.DAYS_KEEP_LOGS));
    change = true;
    html_title += "Updated DAYS_KEEP_LOGS";
  } else if (req.query.MIN_LANGUAGE_USAGE_PC) {
    configVars.MIN_LANGUAGE_USAGE_PC = Number(atob(req.query.MIN_LANGUAGE_USAGE_PC));
    change = true;
    html_title += "Updated MIN_LANGUAGE_USAGE_PC";
  } else if (req.query.TIME_ZONE) {
    configVars.TIME_ZONE = atob(req.query.TIME_ZONE);
    change = true;
    html_title += "Updated TIME_ZONE";
  } else if (req.query.MIN_KEYWORD_FREQ) {
    configVars.MIN_KEYWORD_FREQ = atob(req.query.MIN_KEYWORD_FREQ);
    change = true;
    html_title += "Updated MIN_KEYWORD_FREQ";
  } else if (req.query.MIN_VOTING_POWER) {
    configVars.MIN_VOTING_POWER = atob(req.query.MIN_VOTING_POWER);
    if (configVars.MIN_VOTING_POWER < 0) {
      configVars.MIN_VOTING_POWER = 0;
    } else if (configVars.MIN_VOTING_POWER > 100) {
      configVars.MIN_VOTING_POWER = 100;
    }
    change = true;
    html_title += "Updated MIN_VOTING_POWER";
  } else if (req.query.VOTE_VOTING_POWER) {
    configVars.VOTE_VOTING_POWER = atob(req.query.VOTE_VOTING_POWER);
    if (configVars.VOTE_VOTING_POWER < 0) {
      configVars.VOTE_VOTING_POWER = 0;
    } else if (configVars.VOTE_VOTING_POWER > 100) {
      configVars.VOTE_VOTING_POWER = 100;
    }
    change = true;
    html_title += "Updated VOTE_VOTING_POWER";
  }
  html_title += "</h3>"
  if (change) {
    lib.updateConfigVars(configVars, function(err) {
      //just log it
      if (err) {
        console.log(err)
      }
    });
  }
  res.status(200).send(
    html_edit_config1
    + html_title
    + html_edit_config2
  );
});

app.post("/edit-config", bodyParser.urlencoded({extended: false}), function(req, res) {
  if (!req.session.api_key) {
    handleError(res, "/stats Unauthorized", "edit-config: session is invalid (no session key), please restart from Dashboard", 401);
    return;
  } else if (req.session.api_key.localeCompare(process.env.BOT_API_KEY) != 0) {
    handleError(res, "/stats Unauthorized", "edit-config: session is invalid (out of date session key), please restart from Dashboard", 401);
    return;
  }
  console.log("req.session.api_key = "+req.session.api_key);
  // update config
  var configVars = lib.getConfigVars();
  var change = false;
  var newConfigVars;
  try {
    newConfigVars = JSON.parse(req.body.config_vars);
  } catch (err) {
    console.log("POST /edit-config error: "+err.message);
    handleError(res, "/stats Internal Server Error", "edit-config: updated config var object could not be read", 500);
    return;
  }
  // deprecated
  if (newConfigVars.MAX_VOTES_IN_24_HOURS !== undefined) {
    // nothing
  }
  // active
  if (newConfigVars.MIN_POST_AGE_TO_CONSIDER !== undefined) {
    configVars.MIN_POST_AGE_TO_CONSIDER = newConfigVars.MIN_POST_AGE_TO_CONSIDER;
    change = true;
  }
  if (newConfigVars.TIME_ZONE !== undefined) {
    configVars.TIME_ZONE = newConfigVars.TIME_ZONE;
    change = true;
  }
  if (newConfigVars.MIN_VOTING_POWER !== undefined) {
    configVars.MIN_VOTING_POWER = newConfigVars.MIN_VOTING_POWER;
    change = true;
  }
  if (newConfigVars.VOTE_VOTING_POWER !== undefined) {
    configVars.VOTE_VOTING_POWER = newConfigVars.VOTE_VOTING_POWER;
    change = true;
  }
  if (newConfigVars.MAX_POST_TO_READ !== undefined) {
    configVars.MAX_POST_TO_READ = newConfigVars.MAX_POST_TO_READ;
    change = true;
  }
  if (newConfigVars.MIN_WORDS_FOR_ARTICLE !== undefined) {
    configVars.MIN_WORDS_FOR_ARTICLE = newConfigVars.MIN_WORDS_FOR_ARTICLE;
    change = true;
  }
  if (newConfigVars.NUM_POSTS_FOR_AVG_WINDOW !== undefined) {
    configVars.NUM_POSTS_FOR_AVG_WINDOW = newConfigVars.NUM_POSTS_FOR_AVG_WINDOW;
    change = true;
  }
  if (newConfigVars.MIN_SCORE_THRESHOLD !== undefined) {
    configVars.MIN_SCORE_THRESHOLD = newConfigVars.MIN_SCORE_THRESHOLD;
    change = true;
  }
  if (newConfigVars.SCORE_THRESHOLD_INC_PC !== undefined) {
    configVars.SCORE_THRESHOLD_INC_PC = newConfigVars.SCORE_THRESHOLD_INC_PC;
    change = true;
  }
  if (newConfigVars.CAPITAL_DOLPHIN_MIN !== undefined) {
    configVars.CAPITAL_DOLPHIN_MIN = newConfigVars.CAPITAL_DOLPHIN_MIN;
    change = true;
  }
  if (newConfigVars.CAPITAL_WHALE_MIN !== undefined) {
    configVars.CAPITAL_WHALE_MIN = newConfigVars.CAPITAL_WHALE_MIN;
    change = true;
  }
  if (newConfigVars.MIN_KEYWORD_LEN !== undefined) {
    configVars.MIN_KEYWORD_LEN = newConfigVars.MIN_KEYWORD_LEN;
    change = true;
  }
  if (newConfigVars.DAYS_KEEP_LOGS !== undefined) {
    configVars.DAYS_KEEP_LOGS = newConfigVars.DAYS_KEEP_LOGS;
    change = true;
  }
  if (newConfigVars.MIN_LANGUAGE_USAGE_PC !== undefined) {
    configVars.MIN_LANGUAGE_USAGE_PC = newConfigVars.MIN_LANGUAGE_USAGE_PC;
    change = true;
  }
  if (newConfigVars.MIN_KEYWORD_FREQ) {
    configVars.MIN_KEYWORD_FREQ = newConfigVars.MIN_KEYWORD_FREQ;
    change = true;
  }
  var html_title = "<h3 class=\"sub-header\">" + (change ? "Updated config vars" : "Nothing to update!") + "</h3>";
  if (change) {
    lib.updateConfigVars(configVars, function(err) {
      //just log it
      if (err) {
        console.log(err)
      }
    });
  }
  res.status(200).send(
    html_edit_config1
    + html_title
    + html_edit_config2
  );
});

app.get("/api-error", function(req, res) {
  var title = "Api Error";
  var message = "An unknown error has ocured";
  if (req.query.type && req.query.type.length > 0) {
    if (req.query.type.localeCompare("1")) {
      title =  "Unauthorized";
      message = "api_key or session_key not supplied";
    } else if (req.query.type.localeCompare("2")) {
      title =  "Unauthorized";
      message = "api_key invalid";
    } else if (req.query.type.localeCompare("3")) {
      title = "Unauthorized";
      message = "session_key invalid";
    }
  }
  message += ", please visit the dashboard and start your session.<br/>If this persists people log a bug on GitHub";
  res.send(200, createMsgPageHTML(title, message));
});
