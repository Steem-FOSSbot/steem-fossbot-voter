# Steem FOSSbot

_This document is very incomplete_

## Overview

Steem FOSSbot (Free Open Source bot), is a software ecosystem which comprises a solution for automation on Steem. _Voter_ is the first and most central piece of this, as it is the **curration 'bot'** which actually decides which posts to vote on, and also performs the voting action.

Steem is the underlying system (cryptocurrency blockchain) for the [Steemit](https://steemit.com) social media platform. You can check out the blockchain source at [https://github.com/steemit/steem](https://github.com/steemit/steem).

If you don't know what Steem is, please check out the [Steem White Paper](https://steem.io/SteemWhitePaper.pdf) and the [Steemit.com](https://steemit.com) website.

## Steem FOSSbot components

### Implemented

None

### In progress

- [_Voter_](https://github.com/evm2p/steem-fossbot-voter). A curation bot built as Node.js server, decides which posts to vote for and casts vote on behalf of a registered user.

## Planned 

- _Evolver_. Takes control of _Voter_ to evolve better cultural accuracy and high curation rewards over time with strategy optimisation.
- _Interviewer_. Asks a user questions about what posts they like, which authors, and their Steem curation reward goals to create a custom curation algorithm for use in _Voter_.
- _Mobilizer_. A mobile client for Android or iOS to access the _Voter_ dashboard as native mobile app.
- _Listener_. A conversational UI for web or mobile app to access the _Voter_ dashboard in a quirky, intuitive way.