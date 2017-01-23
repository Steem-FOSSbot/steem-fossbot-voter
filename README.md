# Voter

A Steem FOSSbot

Full documentation is [available here](/docs/index.md).

## What is this?

_Voter_ is a bot for Steem which decides which posts to vote for and casts vote on behalf of a registered user. It is built as a Node.js server and intended for deployment on Heroku, with other installation options planned.

This means _you own the server_ and control it completely. There are no fees or catches, the software is free to use. You create a unique API key for your own access, and for granting access to other if you wish.

You control the running of the bot, set the algorithm and view stats and logs with a simple web dashboard, which will be live at your Heroku URL. See [Usage](https://github.com/evm2p/steem-fossbot-voter#usage) below for more details.

More apps are planned to integrate with this system, which we've called the **Steem FOSSbot ecosystem**. Check out [the doc on Steem FOSSbot](/docs/ecosystem.md) and [our ethos](/docs/ethos.md).

## How it works

The bot works by scoring each new post using a collection of rules which are set by you. If a post scores above a threshold, it is voted for. The threshold is automatically adjusted based on a raised average of recent posts, and is also proportional to the number of votes in last 24 hours, to keep votes per day at around a max of 40 (by default).

Rules are based on a collection of metrics which this app interprets from raw Steem data. For example, you could add 10 score points for every image, or deduct 2 points for every minute since the post was created.

The server is designed to be triggered periodically for a bot run iteration, for example every 30 or 60 minutes. This can be done on Heroku with an add-on, or manually on the dashboard provided, or even by a HTTP GET method to ```/run-bot?json=true&api_key=BOT_API_KEY``` endpoint, which is used internally and can be used externally by a seperate app.

Please see the [discussion doc page](/docs/discussion.md) for in depth details on e curation algorithm and how to use it to create a custom bot, as well as a discussion on bots on Steem in general. For technical details see the [algorithm and metrics doc page](/docs/algorithm.md).

## Usage

Open the bot dashboard using your Heroku app root URL, as above. All operations are available through the dashboard.

The operations you can perform are:

- Run bot now (WILL VOTE)
- Check bot stats and logs
- Edit curation algorithm values and weight
- Run algorithm test (does not actually vote)

## Installation

See the [installation guide](/docs/installation.md), but if you want to jump right in then you can deploy this server to Heroku with one click.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/evm2p/steem-fossbot-voter)

Make sure to read the instructions though! Heroku has a basic free plan but if not familiar with their service you will want to read their terms, privacy policy, etc.

## License and acknowledgements

All original programming is under the CC0 license and so it completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

Included in this repo are the following libraries:

- [Bootstrap](https://getbootstrap.com/) is used for web frontend, and so included in this repo, and is under the MIT license, copyright to Twitter. The license document is in the root folder.
- MD5 Hashing algorithm ([modified from this source](http://www.queness.com/code-snippet/6523/generate-md5-hash-with-javascript) by Paul Johnston and Greg Holt is under copyright and licensed under the BSD license. Legal text [available here](http://pajhome.org.uk/site/legal.html)
- C3js is used for charting stats data and is under [MIT license](/LICENSE-c3), copyright Masayuki Tanaka
- D3js is a dependency for CSjs, and is under [3-part BSD license](/LICENSE-d3), copyright Michael Bostock

The [steem Node.js package](https://www.npmjs.com/package/steem) by adcpm is central to the app, a big thank you to the creators. Please [star it on GitHub](https://github.com/adcpm/steem) to support their development and check out their project [Busy](https://github.com/adcpm/busy).

Several other Node NPM libraries are used as dependencies (thier source is not included in this repo). Thanks to their creators!

- [express](https://www.npmjs.com/package/express), [express-session](https://www.npmjs.com/package/express-session), [body-parser](https://www.npmjs.com/package/body-parser) and [cookie-parser](https://www.npmjs.com/package/cookie-parser) by dougwilson, as basic glue used by nearly every Node.js app
- [sendgrid](https://www.npmjs.com/package/sendgrid) by thinkingserious, to send email notifications
- [Q](https://www.npmjs.com/package/q) by kriskowal, to promise-ify and de-callback-hell-ify the long process of running a bot iteration
- [redis](https://www.npmjs.com/package/redis) by bridgear, to access a redis simple database
- [glossary](https://www.npmjs.com/package/glossary) by harth, for keyword extraction from Steem post body contents using NLP
- [string](https://www.npmjs.com/package/string) by az7arul, for misc super powered string manipulation
- [remark](https://www.npmjs.com/package/remark) and [strip-markdown](https://www.npmjs.com/package/strip-markdown) by wooorm, for de-markdown-ing Steem post body contents
- [retext](https://www.npmjs.com/package/retext) and [retext-sentiment](https://www.npmjs.com/package/retext-sentiment) also by wooorm, for determining sentiment using NLP
- [wait.for](https://www.npmjs.com/package/wait.for) by luciotato, for turning async functions into sync functions

## Disclaimer

We are not required to supply terms because we are not running a service. However obviously you are at your own liability if you use this software. See [the license](/LICENSE) for full legal text.

Contributions via pull request are very welcome, as is issues logged via the GitHub issue tracker. You can also suggest features, such as metrics you'd like to see, UI upgrades, etc.

Also please note that development of this project was done piece-wise, and there are many commits with very little added as a commit was required in order to test any code change.

## Changelog

- v0.1.1
  - break out vote counting to up and down votes; if metric bounds calculation
  - add /stats-data-json and /get-algo endpoints to get last algo run stats and current algo, respectively
  - update algo threshold window to use system to use **sliding window**, huge improvement to post selection for voting
  - add algorithm direct export and import, for backup and algorithm sharing
- **v0.1.0**, minor version 1, soft release as app now works fully in all basic functionality
- v0.0.11, add actual voting, update all UI to reuse API key so only have to enter once in dashboard per section, add test specific post in test algorithm section; this is a release candidate for minor version 1
- v0.0.10, add bot API key wall to all areas of front end UI except dashboard, add stats page (currently only shows last log), add auto threshold adjust based on todays votes, some bug fixes
- v0.0.9, add white / black list editing in UI and supported in backend
- v0.0.8, basic front end UI set up, several improvements and changes to support it and knock-on bug fixing
- v0.0.7, improve successful run bot reporting to http (via callback) and email with nice format
- v0.0.6, basic metrics finished, score calculation confirmed working
- v0.0.5, basic strategic post metrics complete
- v0.0.4, lastPost saving working with redis, so new post fetch and clean to newest only is working
- v0.0.3, refactoring bot library, improving docs
- v0.0.2, early development, including email, develop installation instructions
- v0.0.1, set up basic app structure