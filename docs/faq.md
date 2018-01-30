# FAQ

Common questions and issues with Voter.

## No posts are processed any more

If the first ```MAX_POST_TO_READ``` number of posts (set in your config) are less than ```MIN_POST_AGE_TO_CONSIDER``` minutes old then no posts will be considered for voting.

Due to the increased activity on Steem, this is entirely possible especially if the old default value for MAX_POST_TO_READ is used, which was 300. You should set this to maybe 800, as is the current default.

Please see [issue #78](https://github.com/Steem-FOSSbot/steem-fossbot-voter/issues/78) for more information.

### Is that it?

_If you have an FAQ suggestion please [raise an issue](https://github.com/Steem-FOSSbot/steem-fossbot-voter/issues)._
