# Steem FOSSbot

_This document is very incomplete_

## Overview

Steem FOSSbot (Free Open Source bot), is a software ecosystem which comprise a solution for automation on Steem. _Voter_ is the first and most central piece of this, as the server which actually decides which posts to vote on, and actually performs the voting.

Steem is the underlying system (cryptocurrency blockchain) for the [Steemit](https://steemit.com) social media platform. You can check out the blockchain source at [https://github.com/steemit/steem](https://github.com/steemit/steem).

## Planned Steem FOSSbot components

1. _Evolver_. Takes control of _Voter_ to evolve better cultural accuracy and high curation rewards over time with strategy optimisation.
2. _Interviewer_. Asks a user questions about what posts they like, which authors, and their Steem curation reward goals to create a custom curation algorithm for use in _Voter_.
3. _Mobilizer_. A mobile client for Android or iOS to access the _Voter_ dashboard as native mobile app.
4. _Listener_. A conversational UI for web or mobile app to access the _Voter_ dashboard in a quirky, intuitive way.