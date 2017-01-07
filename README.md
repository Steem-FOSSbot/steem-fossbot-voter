# FOSSbot

FOSSbot, or Free Open Source bot, is a curation bot for Steemit.com, which is an innovating social media platform based on the Steem cryptocurrency. You can check out the blockchain source at [https://github.com/steemit/steem](https://github.com/steemit/steem).

**Warning!**

A lot of this readme is aspirational and not yet implemented!

## Bots on Steemit

Bots, while controversial, have become a fact of Steemit usage. They maximise the rewards of users by voting strategically. They do game the system, but since the system is a game (and one of the co-creators is extremely ambivalent on the subject) it is tolerated.

However it's a concern that good bots are currently only the hands of a few users. While this is their purview, it's ours to use whatever we can within the system to compete with them. They do not really want much high quality bot competition, as it lowers their potential take, but if we don't level the playing field they will dominate the platform too much.

The goal of this project is to bring a high quality and fully customisable bot to anyone who is willing to put in the time to set up a server and write their own customisations. I'd like to see bot programming guilds of people helping each other

### What are you talking about?

Rewards? Strategic voting? Guilds? WHALES? What does it meeeeaan?

This bot is intended for users who already know their way around Steemit.com. If this is gibberish to you, please join and have a look for yourself. In other words, the difficulty here is intermediate.

## How it works

_Note, none of this is implemented yet, it's still in the ideation stage_

See my [original Steemit post here](https://steemit.com/curation/@personz/5qnnnx-free-open-source-steemit-bot-proposal-and-question) where this idea was proposed.

I'd like to propose these are curation goals a bot may maximise, cultural curation and strategic curation, which are interrelated. In my case, I'd like to the cultural aspect to take precedence, and restrict strategic voting somewhat. But I'd like any bot I create to be customisable enough that this is not built in, but rather that these aspects are recognised, and most importantly, measurable.

In order to make a choice on whether or not to vote on a post, we have to have some measurable metric to judge it against. I define strategic metrics to be any aspect which effect payout directly, through the voting algorithm. I define cultural metrics to be those that effect payout indirectly, by attracting voters based on content.

Most strategic metrics are simply readable from the API. But cultural metrics are harder to quantify, and I'd suggest Natural Language Processing (NLP) for this. There are some great libraries available for this.

Here are my suggested metrics:

### Strategic metrics

#### About the post

1. Time since post
2. Estimated payout
3. Number of votes
4. Number of flags / downvotes
5. The Steem Calculator already solves this, but it seems to be closed source (maybe @burnin would like to comment?)

#### About this user
1. Number of posts today
2. Time since last post (posts are rate limited [2])

### Cultural metrics

#### Content
Using NLP

1. Topic
2. Keywords
3. Sentiment / emotional score
4. Length
5. Number of video links
6. Number of photo links
7. Number of webpage links

#### Poster
Make judgements on whether or not the poster is someone you want to support

1. Reputation
2. Capital (either by value or by category, whale, dolphin, minnow)
3. Last post payout
4. Average / median post payout

Additionally you could have always vote or always don't note (white / black listing) for authors manually.

## Installation

_This is a proposal for installation procedure and not yet implemented_

1. Create a Heroku account
2. Deploy this project to the Heroku using the (yet to be added) Heroku Button below
3. Verify the project was set up on Heroku
4. Add a "Config variable" in the Heroku app settings for EMAIL_ADDRESS, adding your email address
5. Deploy the server (this is the terminology to start the server)
6. You will receive an email with a set up key, which can only be used within 5 minutes of it being issued
7. Open the app HTTPS dashboard and click the "Configure" button. Just open the root URL of your app hosted on Heroku, e.g. https://fossbot.herokuapp.com
8. Enter in your set up key
9. An API key will be generated for you. This API key is the only key usable to make a change to the server. Write it down as it cannot be reissued. The API key will only be valid as long as the server stays up, so you'll need to regenerate the API key using this same method

Now you can access your bots settings using the app HTTPS dashboard. You'll be asked for your API key every time you make a change so my recommendation is to use a password manager.

## Usage

The first thing you should do it set you Steemit posting key and test the API. All of this is available through the dashboard.

The operations you can perform are
- Set Steemit posting key
- Edit curation algorithm (hopefully)
- Run algorithm test
- Check bot status and stats
- Modify bot status (i.e. start / stop)

## License and acknowledgements

All original programming is under the CC0 license and so it completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

The [steem Node.js package](https://www.npmjs.com/package/steem), used to access the Steem API, is available on NPM, and the [source is on GitHub](https://github.com/adcpm/steem).