# Dashboard Overview

Once your server is set up, your bot dashboard will be live at your Heroku app address, e.g. http://my-voter-bot.herokuapp.com

From the dashboard you control nearly everything. The notable exceptions are

1. Heroku app variables (AKA environment variables), where you set very private data, such as your Steem posting key, username, email address, etc.
2. Automatic running of the bot. To run an iteration of your bot every ```X``` minutes, you need to use a scheduler. This is discussed in more detail in the [installation guide](/docs/installation.md).

## The Dashboard

_Dashboard with Start Session prompt_

![](/img/dashboard-active-session-1.png)

Through the dashboard you can access the various functions of the bot via a web interface.

In order to authenticate yourself, you need to supply your ```BOT_API_KEY``` into the clearly visible Start Session field. You set this API key when setting up the bot on Heroku or as an environment variable if a local install. It should not be confused with your Steem posting key.

_Dashboard with session activated_

![](/img/dashboard-active-session-2.png)

### Invalid session

If a session is invalid, either due to invalid or missing session key, or server idling or updating, you will see an error screen clearly directing you back to the dashboard.

_API error page_

![](/img/api-error-1.png)

## Overview of Dashboard sections

1. Run Bot
2. Bot Stats
3. Edit Algorithm
4. Edit Config
5. Test Algorithm

### 1. Run bot

This will trigger the bot to perform what we call a **run**, where posts are processed to voting live.

This means that the bot will get the latest posts from the Steem blockchain, score them and vote for any which pass the threshold.

You will see a simple full page message indicating whether the run was successful or not. Success does not necessarily mean votes were cast, but it does mean that the process was completed without any errors.

After a few moments, giving time for the votes to be cast at an interval of 3 seconds each, you can see the results in the particular results in the Last Log section and the Stats section more generally.

For details of how this process works, please see the [discussion doc](/docs/discussion.md).

### 2. Bot Stats

This is an invaluable tool to see whether or not your algorithm is working as you intend it. You can then make corrections to it and refine your process, based on real data.

Please note that stats are only kept for a limited number of days due to the storage limitation of the Heroku free accounts for which this set up is intended. If you have a paid plan or are using this bot locally, you can set the configuration variable ```DAYS_KEEP_LOGS``` to a larger number of days. It is set to 5 by default.

#### Stats available

There are currently three collections of stats you can view:

- General overview
- Daily likes overview
- Bot run overview

Note that in all stats charts, if you hover your mouse over elements of the chart, a popover will display with more information about that element.

#### General overview

_General overview page_

![](/img/stats-overview-1.png)

Two charts are shown on the general overview page, which is the landing page for stats: the number of posts processed per bot run, and the number of posts liked per bot run.

Days divisions are shown by block background colour.

On the left side there is a list of links for all recorded bot runs, headed by the daily summary of likes for that day.

#### Daily likes overview

_Daily likes overview, first graph: overall post scores and threshold_

![](/img/stats-overview-2.png)

The daily likes overview shows you only the posts you have voted on within a certain day. It is in indicator of whether the posts you are catching are the ones you want or not.

You can also use it as a kind of daily round up of the posts you missed, as if you are a human you must do other things than just sit on Steemit, viewing posts!

_Daily likes overview, second graph: metrics scoring detail_

![](/img/stats-overview-3.png)

The charts used are the same as the ones for Bot Run (see below), they are just applied to the liked posts, so you'll see no negative scores in the overall score, and probably very little in the metric breakdown.

#### Bot Run overview

It is important to understand how posts are scored in relation to each other, in sequence. This is because the score threshold is adjusted for each post, including the last ```NUM_POSTS_FOR_AVG_WINDOW``` number of posts.

_Bot run overview: overall post scores and threshold_

![](/img/stats-overview-4.png)

The first graph shows the score of each post as a blue bar. It also shows the ```MIN_SCORE_THRESHOLD``` in gray and the current score threshold when that post was scored.

As is explained in the [algorithm doc](/docs/algorithm.md), any post score equal to or above ```MIN_SCORE_THRESHOLD``` is included in the score threshold window, which uses an adjusted averaging formula. Thus if there are a lot of posts scored low at around ```MIN_SCORE_THRESHOLD```, the score threshold will drop, lowering the "standard" of post quality so that a moderately highly scored post is more likely to be voted on. Conversely, if the standard is very high, it is less likely a post will be voted on.

This is moderately complex, and so it's very useful to see how it actually works in graph form.

_Bot run overview: metrics scoring detail_

![](/img/stats-overview-5.png)

If you think too many posts are being picked, adjust you algorithm, and you can also change the third contribution to the score threshold, the ```SCORE_THRESHOLD_INC_PC```, to increase the threshold, or in other words, demand a higher standard. By default it's set to a sensible value of ```0.1``` (i.e. ```10%```).

While the overall score is what counts, it is made up a sum of individual scores based on metrics. See the [algorithm doc](/docs/algorithm.md) for more details, but each metric is multiplied by a weight which is set by you. We call the set of these weights (and the white / black-lists) the _algorithm_ of the bot, and is set in the Edit Algo section, accessed from the dashboard.

You can see the breakdown of each individual metric score. Note that each individual score already has the algorithm applied, i.e. is ```metric * weight```.

These are colored and displayed for each post. Positive scores stick above the horizontal x-axis, negative stick below. You can mouse over either the score bars or even the metrics key legend on the right side, to see specific information.

_Bot run overview: metrics scoring detail, hover over a particular item_

![](/img/stats-overview-7.png)

This is really useful for seeing whether your algorithm is contributing to the overall post scores as you intend it too. Perhaps you will see that one metric has too large or too small an effect, and so you can then adjust the weight in the Edit Algorithm section.

_Bot run overview: post links and summary_

![](/img/stats-overview-6.png)

Here you can see the posts that were process, but in a more readable format. It shows the post (with steemit.com link), the score and YES or NO depending if it was voted or not.

### 3. Edit Algorithm

In order for the bot to function _at all_, you must set your algorithm for it. To be clear, the bot server contains a lot of code already, but you need to tell it how you want to score posts. We call this the **algorithm**.

For a more detailed explanation, see the [algorithm doc](/docs/algorithm.md).

There are several parts to the algorithm:

- A collection of weights
- Some white / blacklists
- Comment to make on voted posts (optional)

#### Weights

When the bot runs (performs an iteration on the newest posts), it scores them. The if the resulting score meets the threshold requirement, the post is voted on. The threshold is automatically adjusted for each post, more details above in the stats section, and also of course in the [algorithm doc](/docs/algorithm.md).

This score is calculated by adding up each metric you have chosen to use. Before adding them together, the metrics are scaled (and optionally confined to a range of values) using what we term **weights**.

You can think of a weight as the relative importance of that particular metric, with regards to its own range of values.

Some metrics are _numeric_ and can have any number value which is sensible, and some metrics are _boolean_, and are 0 if false or 1 if true.

#### White / blacklists

By themselves these lists do nothing but they are used for certain metrics. There are four white / blacklists:

- **Author**: used for when looking the poster of the article and also the voters on an article, such as ```author_is_blacklisted```.
  - Note that it is also possible to use your followed users (e.g. ```author_is_followed```), you don't have to add them to this list. Muted users however or inaccessible.
- **Content category and tag**: used when looking at post tags, including the first tag which is also referred to as the category, such as ```post_num_tags_whitelisted```
- **Content word**: used in NLP (natural language processing) metric involving keywords, such as ```post_num_keywords_whitelisted```
- **Domain**: used for website links, such as ```post_any_link_domains_blacklisted```

_Edit Algorithm, top of page_

![](/img/edit-algo-1.png)

#### Comment

Optionally you can set the bot to comment on every post you vote for. This must be plain text but can include any normal characters as well as unicode, so there is support for emoji and the characters of the world's languages.

To enable this feature you must set the text here and also turn it on in the configuration variable. Go to Edit Config to set this.

![](/img/edit-algo-comment.png)

#### Features

- Clicking a metric name in the reference list at the bottom of the page will add that metric to the top metric update form, for ease of use
- Clicking an existing metric name in your algorithm will add the values already set to the top metric update form, so you can update them easily
- You can delete a metric from your algorithm with the _delete_ button on the right side
- You can export or import the entire algorithm as JSON. This is useful for sharing algorithms, or backing up.

### 4. Edit Config

Editing the configuration is the second way you can affect the running of your bot. These are settings, which means they are values which do not change often.

There are two categories

- Standard: most people will want to edit these
- Advanced: edit with caution, setting these incorrectly can really break the bot

_Edit Configuration, top of page_

![](/img/edit-config-1.png)

Note, you can only edit one config variable at a time, and after each update you must press the corresponding _update_ button.

You can also export or import the entire set of config variables for sharing or back up.

### 5. Test Algorithm

You can run a test of your algorithm which will score posts and generate logs and stats, but which will not actually cast votes.
