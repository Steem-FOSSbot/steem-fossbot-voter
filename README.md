# Voter

A Steem FOSSbot

**Please note that the bot is still in planning and development and is not yet fully functional.**

Documentation is [available here](/docs/index.md).

## What is this?

_Voter_ is a bot for Steem, built as a Node.js server and intended for deployment on Heroku or compatible.

For more information about the planned Steem FOSSbot ecosystem, check out [the doc on Steem FOSSbot](/docs/steemfossbot.md) and [our ethos](/docs/ethos.md).

## How it works

New posts are pulled from the Steem API and each is assigned a score based on a user customisable algorithm. Posts which have a high enough score are voted on.

Please see the [discussion doc page](/docs/discussion.md) for an overview on how the curation algorithm works and how to use it to create a custom bot, as well as a discussion on bots on Steem in general. For technical details see the [algorithm and metrics doc page](/docs/algorithm.md)

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

Make sure to read the instructions though!

## License and acknowledgements

All original programming is under the CC0 license and so it completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

The [steem Node.js package](https://www.npmjs.com/package/steem), used to access the Steem API, is available on NPM, and the [source is on GitHub](https://github.com/adcpm/steem).

Bootstrap is used for web frontend and is under the MIT license copyright to Twitter.

## Changelog

- v0.0.11, **add actual voting**, update all UI to reuse API key so only have to enter once in dashboard per section, add test specific post in test algorithm section; this is a release candidate for minor version 1
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