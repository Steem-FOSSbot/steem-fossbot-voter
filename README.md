# Voter

A Steem FOSSbot

**Please note that the bot is still in planning and development and is not yet functional.**

Documentation is [available here](/docs/index.md).

## What is this?

_Voter_ is a bot for Steem, built as a Node.js server and intended for deployment on Heroku or compatible.

For more information about the planned Steem FOSSbot ecosystem, check out [the doc on Steem FOSSbot](/docs/steemfossbot.md) and [our ethos](/docs/ethos.md).

## How it works

New posts are pulled from the Steem API and each is assigned a score based on a user customisable algorithm. Posts which have a high enough score are voted on.

Please see the [discussion doc page](/docs/discussion.md) for an overview on how the curation algorithm works and how to use it to create a custom bot, as well as a discussion on bots on Steem in general. For technical details see the [algorithm and metrics doc page](/docs/algorithm.md)

## Usage

_Note, the dashboard is not currently functional, instead you'll find a placeholder webpage._

Open the bot dashboard using your Heroku app root URL, as above. All operations are available through the dashboard.

The operations you can perform are:

- Check bot status and stats
- Modify bot status (i.e. start / stop)
- Edit curation algorithm values and weight
- Run algorithm test

## Installation

See the [installation guide](/docs/installation.md).

## License and acknowledgements

All original programming is under the CC0 license and so it completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

The [steem Node.js package](https://www.npmjs.com/package/steem), used to access the Steem API, is available on NPM, and the [source is on GitHub](https://github.com/adcpm/steem).

Bootstrap is used for web frontend and is under the MIT license copyright to Twitter.