# Voter Documentation

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

All metrics current at time of metric sample, of course:

#### About the post

1. Time since post
2. Estimated payout
3. Number of votes
4. Number of flags / downvotes

The Steem Calculator already solves this, but it seems to be closed source (maybe @burnin would like to comment?)

#### About this user
1. Number of posts today
2. Time since last post (posts are rate limited [2])

### Cultural metrics

#### Content - Text

_Using NLP_

1. Topic
2. Keywords
3. Sentiment / emotional score
4. Length
5. Presence of any / number of whitelist words
6. Presence of any / number of blacklist words

#### Content - Links
1. Number of video links
2. Number of photo links
3. Number of webpage links
4. Total number of links
5. Presence of any / number of whitelist domains
6. Presence of any / number of blacklist domains

#### Poster

_Make judgements on whether or not the poster is someone you want to support_

1. Reputation
2. Capital (either by value or by category, whale, dolphin, minnow)
3. Last post payout
4. Average / median post payout
5. Presence of author on whitelist
6. Presence of author on blacklist