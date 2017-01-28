# Usage Guide

Once your server is set up, your bot dashboard will be live at your Heroku app address, e.g. http://my-voter-boy.herokuapp.com

From the dashboard you control nearly everything. The notable exceptions are

1. Heroku app variable (AKA environment variables), where you set very private data, such as your Steem posting key, username, email address, etc.
2. Automatic running of the bot. To run an iteration of your bot every ```X``` minutes, you need to use a scheduler. This is discussed in more detail in the [installation guide](/docs/installation.md).

## The Dashboard

_Dashboard with Start Session prompt_

![](/img/dashboard-active-session-1.png)

Through the dashboard you can access the various functions of the bot via a web interface.

In order to authenticate yourself, you need to supply your ```BOT_API_KEY``` into the clearly visible Start Session field. You set this API key when setting up the bot on Heroku or as an environment variable if a local install. It should not be confused with your Steem posting key, or SendGrid (email sender) API key.

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
6. Last Log

### 1. Run bot

This will trigger the bot to perform what we call an **iteration** or **run**.

This means that the bot will get the latest posts from the Steem blockchain, score them and vote for any which pass the threshold.

You will see a simple full page message indicating whether the run was successful or not. Success does not mean votes were cast, but that the process was completed without any errors.

After a few moments, giving time for the votes to be cast at an interval of 3 seconds each, you can see the results in the particular results in the Last Log section and the Stats section more generally.

For details of how this process works, please see the [discussion doc](/docs/discussion.md).

### 2. Bot Stats

The most sexy and useful area! You can see in an easy to understand and visual way how your bot is operating.

This is an invaluable tool to see whether or not your algorithm

Please note that stats are only kept for a limited number of days by default due to the storage limitation of the Heroku free accounts for which this set up is intended. If you have a paid plan or are using this bot locally, you can set the configuration variable _DAYS_KEEP_LOGS_ to a larger number of days. It is set to 5 by default.

#### Stats available

There are currently three collections of stats you can view:

- General overview
- Bot run overview
- Daily likes overview

Note that in all stats charts, if you hover your mouse over elements of the chart, a popover will display with more information about that element.
 
#### General overview

_General overview page_

![](/img/stats-overview-1.png)

Two charts are shown on the general overview page, which is the landing page for stats: the number of posts processed oer bot run, and the number of posts liked per bot run.

Days divisions are shown by block background colour.
 
On the left side there is a list of links for all recorded bot runs, headed by the daily summary of likes for that day.

#### Bot Run overview

It is important to understand how posts are scored in relation to each other, in sequence. This is because the score threshold is adjusted for each post, including the last ```NUM_POSTS_FOR_AVG_WINDOW``` number of posts.

The first graph shows the score of each post as a blue bar. It also shows the ```MIN_SCORE_THRESHOLD``` in gray and the current score threshold when that post was scored.

As is explained in the [algorithm doc](/docs/algorithm.md), any post score equal to or above ```MIN_SCORE_THRESHOLD``` is included in the score threshold window, which uses an adjusted averaging formula. Thus if there are a lot of posts scored low at around ```MIN_SCORE_THRESHOLD```, the score threshold will drop, lowing the "standard" of post quality to that a moderately highly scored post is more likey to be voted on. Conversely, if the standard is very high, it is less likely a post will be voted on.

This is intended to keep voting within the desired amount per day, specified as ```MAX_VOTES_IN_24_HOURS```. Additionally, the closer the number of posts today are to this number, the higher the score threshold, as this is added to it.
  
This is moderately complex, and so it's very useful to see how it actually works in graph form.

If you think too many posts are being picked, adjust you algorithm, and you can also change the third contribution to the score threshold, the ```SCORE_THRESHOLD_INC_PC```, to increase the threshold, or in other words, demand a higher standard. By default it's set to a sensible value of ```0.1``` (i.e. ```10%```).

![](/img/bot-run-overview-1.png)

While the overall score is what counts, it is made up a sum of individual scores based on metrics. See the [algorithm doc](/docs/algorithm.md) for more details, but each metric is multiplied by a weight which is set by you. We call the set of these weights (and the white / black-lists) the _algorithm_ of the bot.

You can see the breakdown of each individual metric score. Note that each individual score already has the algorithm applied, i.e. is ```metric * weight```.

![](/img/bot-run-overview-2.png)

These are colored and displayed for each post. Positive scores stick above the horizontal x-axis, negative stick below. You can mouse over either the score bars or even the metrics key legend on the right side, to see specific information.

![](/img/bot-run-overview-3.png)

This is really useful for seeing whether your algorithm is contributing to the overall post scores as you intend it too. Perhaps you will see that one metric has too large or too small an effect, and so you can then adjust the weight in the Edit Algorithm seciton.

#### Daily likes overview

Once you have a handle on the bot runs, the daily likes overview will become the more important charts. It is here that you can see that the posts you are catching are the ones you want, at a glance.

You can also use it as a kind of daily round up of the posts you missed, as if you are a human you must do other things than just sit on Steemit, viewing posts!

The charts used are the same as the ones for Bot Run, they are just applied to the liked posts, so you'll see no negative scores in the overall score, and probably very little in the metric breakdown.

![](/img/daily-likes-overview-1.png)

![](/img/daily-likes-overview-2.png)

![](/img/daily-likes-overview-3.png)

### 3. Edit Algorithm

![](/img/edit-algo-1.png)

TODO

### 4. Edit Config

Editing the configuration is the second way you can affect the running of your bot. These are settings, which means they are values which do not change often.

There are two categories

- Standard: most people will want to edit these
- Advanced: edit with caution, setting these incorrectly can really break the bot

![](/img/edit-config-1.png)

### 5. Test Algorithm

You can run a test of your algorithm which will score posts and generate logs and stats, but which will not actually cast votes.

### 6. Last Log

View the log of your last bot run. This starts off very human readable and gets increasingly technical.

The technical part is designed with debugging and error reporting in mind, as this software is still in early release. 