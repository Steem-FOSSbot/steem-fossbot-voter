# Voter

<img src="/img/voter-banner-150.png" alt="Voter logo" style="width: 150px; height: 150px"/>

A Steem FOSSbot, by [personz](https://steemit.com/@personz)

Full documentation is [available here](/docs/index.md).

## Project goal

The goal of this project is to bring a high quality and fully customisable bot to anyone who is willing to put in the time to set up a simple server and make their own customisations.

For more information, see the [discussion doc page](/docs/discussion.md).

## What is this?

_Voter_ is a bot for Steem which decides which posts to vote for and casts votes on behalf of a registered user. It is built as a Node.js server and intended for deployment on Heroku, with other installation options planned.

This means _you own the server_ and control it completely. There are no fees or catches, the software is free to use. You create a unique API key for your own access, and for granting access to others if you wish.

You control the running of the bot, set the algorithm and view stats and logs with a simple web dashboard, which will be live at your Heroku URL. See [Usage](https://github.com/Steem-FOSSbot/steem-fossbot-voter#usage) below for more details.

A plugin system has been proposed and will hopefully be implemented. Please refer to [the ticket](https://github.com/Steem-FOSSbot/project-tracker/issues/8) on the main [Steem FOSSbot organization project-tracker](https://github.com/Steem-FOSSbot/project-tracker) for more information.

Lastly, check out [our ethos](/docs/ethos.md). Bots can be a divisive subject and this document clearly lays out our position.

## How it works

The bot works by scoring each new post using a collection of rules which are set by you. If a post scores above a threshold, it is voted for. The threshold is automatically adjusted based on a raised average of recent posts, and is also proportional to the number of votes in the last 24 hours, to keep votes per day at around a max of 40 (by default).

Rules are based on a collection of metrics which this app interprets from raw Steem data. For example, you could add 10 score points for every image, or deduct 2 points for every minute since the post was created.

These rules, called an algorithm, are editable through the server app Dashboard, and you can also view run statistics, logs and tests here.

The server is designed to be triggered periodically for a bot run iteration, for example every 30 or 60 minutes. This can be done on Heroku with an add-on, or manually on the dashboard provided, or even by a HTTP GET method to ```/run-bot?json=true&api_key=BOT_API_KEY``` endpoint, which is used internally and can be used externally by a separate app.

Please see the [discussion doc page](/docs/discussion.md) for in depth details on the curation algorithm and how to use it to create a custom bot, as well as a discussion on bots on Steem in general. For technical details see the [algorithm and metrics doc page](/docs/algorithm.md).

## Usage

Open the bot dashboard using your Heroku app root URL, as above. All operations are available through the dashboard.

The operations you can perform are:

- Run bot now (WILL VOTE)
- Check bot stats (this is pretty cool)
- Edit curation algorithm weights and white / black lists, set comment
- Edit configuration and settings of bot
- Run algorithm test (does not actually vote)
- View last log

For more detail on the dashboard (and more screen shots!), see the [dashboard overview doc](/docs/dashboard-overview.md)

_Dashboard with active session_

![](/img/dashboard-active-session-1.png)

---

_Stats for post metrics breakdown_

![](/img/stats-overview-4.png)

## Installation

See the [installation guide](/docs/installation.md), but if you want to jump right in then you can deploy this server to Heroku with one click.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/Steem-FOSSbot/steem-fossbot-voter)

Make sure to read the instructions though! Heroku has a basic free plan but if not familiar with their service you will want to read their terms, privacy policy, etc.

## Update

Please see also the [installation guide](/docs/installation.md) for instructions on how to keep your server up to date with further releases of Voter.

### IMPORTANT

**If you are updating from before v0.3.0 you will need to do a clean reinstall, so please back up your data before upgrading.**

## License and acknowledgements

All original programming is under the CC0 license and thus completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

Included in this repo are the following libraries, and all licenses are in the root folder of the project, except where stated:

- [Bootstrap](https://getbootstrap.com/) is used for web frontend, and so included in this repo, and is under the [MIT license](/LICENSE-Bootstrap), copyright to Twitter.
- [jQuery](https://github.com/jquery/jquery) is used as a dependency of Bootstrap, and for grabbing stats and algorithm data on request from the browser. It is copyright JS Foundation and other contributors and used by permission of the [license](/LICENSE-jQuery.txt)
- MD5 Hashing algorithm ([modified from this source](http://www.queness.com/code-snippet/6523/generate-md5-hash-with-javascript)) by Paul Johnston and Greg Holt is under copyright and licensed under the BSD license. Legal text [available here](http://pajhome.org.uk/site/legal.html) and [at source usage](/extra.js)).
- [C3js](http://c3js.org/) is used for charting stats data and is under [MIT license](/LICENSE-c3), copyright Masayuki Tanaka
- [D3js](https://d3js.org/) is a dependency for CSjs, and is under [3-part BSD license](/LICENSE-d3), copyright Michael Bostock

The [steem Node.js package](https://www.npmjs.com/package/steem) by adcpm is central to the app, a big thank you to the creators. Please [star it on GitHub](https://github.com/adcpm/steem) to support their development and check out their project [Busy](https://github.com/adcpm/busy).

Several other Node NPM libraries are used as dependencies. Their source is not included in this repo, but is downloaded when the server is built. Thanks to their creators!

- [express](https://www.npmjs.com/package/express), [express-session](https://www.npmjs.com/package/express-session), [body-parser](https://www.npmjs.com/package/body-parser), [cookie](https://www.npmjs.com/package/cookie) and [cookie-parser](https://www.npmjs.com/package/cookie-parser) by dougwilson, as widely used glue, used by many Node.js apps
- [Q](https://www.npmjs.com/package/q) by kriskowal, to promise-ify and de-callback-hell-ify the long process of running a bot iteration
- [redis](https://www.npmjs.com/package/redis) by bridgear, to access a redis simple database
- [glossary](https://www.npmjs.com/package/glossary) by harth, for keyword extraction from Steem post body contents using NLP
- [string](https://www.npmjs.com/package/string) by az7arul, for misc super powered string manipulation
- [remark](https://www.npmjs.com/package/remark) and [strip-markdown](https://www.npmjs.com/package/strip-markdown) by wooorm, for de-markdown-ing Steem post body contents
- [retext](https://www.npmjs.com/package/retext) and [retext-sentiment](https://www.npmjs.com/package/retext-sentiment) also by wooorm, for determining sentiment using NLP
- [languagedetect](https://www.npmjs.com/package/languagedetect) by fgribreau, to detect the written language of the content (latin script only)
- [wait.for](https://www.npmjs.com/package/wait.for) by luciotato, for turning async functions into sync functions
- [moment](https://www.npmjs.com/package/moment) by ichernev and [moment-timezone](https://www.npmjs.com/package/moment-timezone) by maggiepint, for better date handling, formatting and time zone adjustment

## Disclaimer

We are not required to supply terms because we are not running a service. However, obviously you are at your own liability if you use this software. See [the license](/LICENSE) for full legal text.

Contributions via pull request are very welcome, as are issues logged via the GitHub issue tracker. You can also suggest features, such as metrics you'd like to see, UI upgrades, etc.

Also, please note that development of this project was done piece-wise, and there are many commits with very little added, as a commit was required in order to test any code change.

Finally, as mentioned in the [discussion](/docs/discussion.md), this project is not intended as a customer ready solution, it is a kind of "hobby grade" project. As such, **do not expect consumer level support**.

## Changelog

- v0.3.2
  - new feature to allow for posting a comment on voted posts #92
  - fix stats page issues #129, #143
  - fix accounts information not fetching, causing author related metrics to have no effect #133
  - fix double processing posts on next run #140
  - minor issues #132, #134
  - and error logging for ongoing issue #142
- v0.3.1
  - Update moment and moment-timezone dependency versions CVE-2017-18214 vulnerability found
  - Small improvement to error handling in Steem initialization phase
- v0.3.0
  - Minor version upgrade!
  - change database to MongoDB, remove Redis DB #64, and related #94, #124, #123
  - speed up web app loading #21, #93
  - fix Test Algo feature #116
  - remove SendMail email update feature #95
  - remove last log feature #122
  - update docs #99, #42, #51, #75
  - misc other bug fixes #121, #86
- v0.2.10
  - Emergency bug fix, change WebSocket server to GTG hosted, fixes #93
- v0.2.9
  - switch to voting power conservation instead of max votes per day
  - completed issues #7, #87, #25, #71, #90
- v0.2.8
  - bug fixes for issues #27, #1, #63, #41, #24, #69, #70, #54, #62, #74, #84, #77, #78
- v0.2.7
  - some additional bug fixes
- v0.2.6
  - first main round of bug fixes for milestone [Public beta bug fixes and minor improvements](https://github.com/Steem-FOSSbot/steem-fossbot-voter/milestone/1)
  - #2, #56, #31, #25, #26, #49, #52, #44, #10, #53
- v0.2.1 to v0.2.5
  - v0.2.5, updated patch to fix bot.js not exiting when finished if run locally
  - v0.2.4, patch to implement missing POST /edit-config endpoint
  - v0.2.3, patch to fix bot.js not exiting when finished if run locally
  - v0.2.2, patch to fix express warnings as they prevent correct operation on some local instances
  - v0.2.1
    - Emergency bug fix for steem.js secure WebSocket URL incorrect, Steem have migrated their server access URL
    - Add indication to look for newest steem.js library
- v0.2.0 - **First public release!** No appreciable change from v0.1.5, release versioning up only
- v0.1.5
  - update docs for release, fill in missing parts and check for completeness
  - add logo to dashboard and docs
  - fix daily digest email
  - fix many small bugs holding up release
- v0.1.4
  - improve start session to use POST on dashboard, improve UI feedback for session state
  - add edit configuration page and backend support
  - add daily email digest option instead of for each bot run
  - move times into configurable timezone
  - add support for single metric algo usage
  - fix misc bugs
- v0.1.3, add language detection (some European languages only), remove jQuery CDN dependency, add minimum threshold to score chart, some bug fixes and docs updates
- v0.1.2
  - add first version of stats, with pretty charts
  - upgrade session management to be more secure and have better user experience. Now only enter key once and some 'service' endpoints use temporary key to get data
  - misc bug fixes and updates to docs, etc.
- v0.1.1
  - break out vote counting to up and down votes; if metric bounds calculation
  - add /stats-data-json and /get-algo endpoints to get last algo run stats and current algo, respectively
  - update algo threshold window to use system to use **sliding window**, huge improvement to post selection for voting
  - add algorithm direct export and import, for backup and algorithm sharing
- **v0.1.0**, minor version 1, soft release as app now works fully in all basic functionality
- v0.0.11, add actual voting, update all UI to reuse API key so only have to enter once in dashboard per section, add test specific post in test algorithm section; this is a release candidate for minor version 1
- v0.0.10, add bot API key wall to all areas of frontend UI except dashboard, add stats page (currently only shows last log), add auto threshold adjust based on todays votes, some bug fixes
- v0.0.9, add white / black list editing in UI and supported in backend
- v0.0.8, basic frontend UI set up, several improvements and changes to support it and knock-on bug fixing
- v0.0.7, improve successful run bot reporting to http (via callback) and email with nice format
- v0.0.6, basic metrics finished, score calculation confirmed working
- v0.0.5, basic strategic post metrics complete
- v0.0.4, lastPost saving working with redis, so new post fetch and clean to newest only is working
- v0.0.3, refactoring bot library, improving docs
- v0.0.2, early development, including email, develop installation instructions
- v0.0.1, set up basic app structure
