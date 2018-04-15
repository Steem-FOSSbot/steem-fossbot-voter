# FAQ

Common questions and issues with Voter.

## No posts are processed any more

If the first ```MAX_POST_TO_READ``` number of posts (set in your config) are less than ```MIN_POST_AGE_TO_CONSIDER``` minutes old then no posts will be considered for voting.

Due to the increased activity on Steem, this is entirely possible especially if the old default value for MAX_POST_TO_READ is used, which was 300. You should set this to maybe 800, as is the current default.

Please see [issue #78](https://github.com/Steem-FOSSbot/steem-fossbot-voter/issues/78) for more information.

## Why don't I see details of all the posts the bot votes for in the stats section?

In 2018 the Steem network is now so busy that there are enough posts to jam up your database if we record every post that is scanned. For most use cases you only need to see a small sample of the posts you didn't vote for to confirm your algorithm is working as you intend.

As of [issue #129](https://github.com/Steem-FOSSbot/steem-fossbot-voter/issues/78) only the first 100 posts are kept by default. You can change this behavior in the config variables. Be warned that if you set it high you risk maxing out your DB storage.

### Is that it?

_If you have an FAQ suggestion please [raise an issue](https://github.com/Steem-FOSSbot/steem-fossbot-voter/issues)._
