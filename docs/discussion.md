# Discussion

This document assumes a minimum knowledge of Steem and Steemit. If you don't know what Steem is, please check out the [Steem White Paper](https://steem.io/SteemWhitePaper.pdf) and the [Steemit.com](https://steemit.com) website.

## Bots on Steemit

Bots, while controversial, are common on the Steem blockchain. They can maximise the rewards of users by voting strategically. They do game the system, but since the system is a game (and one of the co-creators is extremely ambivalent on the subject) it is tolerated.

It's a concern that good bot software are mainly in the hands of a few users. While this is their purview, it's ours to use whatever we can within the system to compete with them. We attempt here to level the playing field by providing a free, actively supported tool.

Where the general tools exist to add automatic curation, they come at a cost, which can be a mandatory vote for the services' posts, direct payment, or even by relinquishing data control by tracking.

### So what is this?

The goal of this project is to bring a high quality and fully customisable bot to anyone who is willing to put in the time to set up a simple server and make their own customisations.

We recognise that there is a investment of time and patience required to set this up and ever effort has been made to make this as easy as possible. In the future it would be ideal to have a super simple, consumer grade interface but we're not there yet.

Be encouraged though that it is certainly possible to set up without any existing technical knowledge, just a user's knowledge of Steem and patience to follow the tutorial.

To get started, see the [installation instructions](/docs/installation.md).

### And what is it NOT?

This bot is not

1. **A down vote / flagging bot**. You cannot down vote anyone, though it would be trivial to add it to the source, I have not provided this option.
2. **A professional solution or customer ready app**. This is more of a "hobby" grade project in its current form. It operates as described and achieves a lot but it does not have a highly developed UI, code security review and the code needs some clean up and refactoring.
3. **A comment spamming or auto-post bot**. It's just for (up) voting.

## How it works

See the [original Steem post here](https://steemit.com/curation/@personz/5qnnnx-free-open-source-steemit-bot-proposal-and-question) where this idea was proposed.

### Definition of problem

To state the problem directly; **to automatically vote for posts that I would vote for anyway while also maximising my curation rewards.**

To break this down, we can separate two distinct curation goals which are in conflict with each other: cultural curation and strategic curation.

#### Cultural curation

Cultural curation votes for posts based on the content of the post and other related cultural, and thus social aspects. When you curate culturally, you vote for a post because you liked the content, or even if you didn't like it, you thought it was well written. In other words, it contributes to the culture of Steem in a positive way, however you wish to define it.

There are a lot of other peripheral influences for a cultural vote. Perhaps you didn't read a post, or didn't much like it, but want to support the author for a different reason, such as you know and like them, or they are new, or any number of possibilities. A broad definition of cultural curation would include them all.

#### Strategic curation

Strategic curation votes for posts that will yield the best curation reward, and over time votes in a pattern which maximises reward in the long term. Any user of Steem will know that the "best" posts do not always get the highest rewards, and sometimes "undeserving" posts get very high rewards. The existence of betting, games, competitions, and the presence of whales, etc. complicates matters significantly.

#### In conflict but also collaboration

If we do not want to disregard cultural curation completely, we must have some element of strategy. And it makes sense to maximise the Steem Power of your account, not just for personal gain, but also so that your cultural curation have more weight, thus making your votes stronger and ultimately promoting the kind of content you wish to see, or in other words, contributing towards creating a culture on Steem which you are part of.

A holistic solution will include both aspects, cultural and strategy. They interact with each other. Cultural aspects effect payout indirectly, by attracting voters based on content, so they will always be worth considering even if one is concerned purely with curation rewards.

### Solution to the problem

#### Reducing complexity

When we visit at Steemit.com or another portal to the Steem blockchain, we see new posts since our last visit. If we visit periodically we will have a collection of new posts which we could potentially vote for. We may only vote on posts that are at least 30 minutes old, since this is the period after which curation payout is at 100% (see [this article](https://steemit.com/steem/@abit/new-curation-reward-algorithm-huge-penalty-to-early-voters)), and it also gives us some data about what kind of attention the post has already attracted.

We must reduce the complex question of whether or not to vote on a post to a simple yes or no for each post. To reduce it a little less, say we calculate a numeric score for each post, and choose the post to vote on based on some criteria. This scoring process will be multi-dimensional but we can make each dimension simple enough to calculate with a simple test, and then combine each individual score.

These individual scores will be based on **metrics**, such as word count, number of votes already cast, whether the author is followed, etc. These are _deterministic_. Metrics are combined into a single score using an algorithm of values, weights and conditions, which we'll just call an algorithm. The metrics are facts of the Steem posts and environment, whereas the algorithm is a customizable process which each user can tweak to make their own bot curate as they would like it to curation. See the [algorithm doc page](/docs/algorithm.md) for a detailed, technical look at this.

In the simplest case, we would choose to vote on any post which had a score greater than a certain value. This value is called a threshold. But it is a bit more complex than that, as we'll see.

#### Constrained by vote frequency

Let's say we have scored all the new posts we're interested in. Since voting is **rate limited** (by time), each time a vote is cast the next vote's power is reduced, and it is restored slowly in periods of voting inactivity.

From the [Steem White Paper](https://steem.io/SteemWhitePaper.pdf), pg 18:

> Through rate limiting, stakeholders who vote more frequently have each vote count for less than stakeholders who vote less frequently. [...] a user’s voting power decreases every time they vote and then regenerates as time passes without voting. [...] Note that voting power rapidly drops off during periods of continuous voting, and then slowly recovers.

From a strategy point of view, it makes sense to restrict the number of votes cast. Previously the algorithm limited votes to a maximum number per day but now we vote and keep voting power above a certain percentage. This is especially relevant since Hard Fork 19 which changed the effective number of votes one can make per day.

If votes are too few  you cannot have an cultural impact nor get enough curation rewards; too many and you dilute your impact. Another strategy factor is that the earlier you vote for a post which _will be_ successful, the larger your curation reward. So clearly it is prudent to check for new posts often.

Though on average you should vote every 30 to 60 minutes, the best posts will most likely not be made so regularly. A potential solution to this dilemma is to use a **sliding window score average as a threshold** to determine if a post has a high enough score to vote on, and to sample N (i.e. see if there are new posts) often. This means that the likelihood of voting on a new post is related to the scores of the previous posts.

This is the method implemented in this bot. From the [algorithm doc](/docs/algorithm.md):

> In general, the threshold decreases if the scores have been low, and increases if the scores are high. If there are a few good posts in one hour, it will get progressively less likely the are all voted on, as the threshold will get raised for each good post scored and processed. Similarly, if a lot of posts score very low, the next good post is much more likely to be voted on.

See that doc for more details on how votes are kept in check.
