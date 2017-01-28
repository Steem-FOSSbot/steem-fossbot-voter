# Usage Guide

Once your server is set up, your bot dashboard will be live at your Heroku app address, e.g. http://my-voter-boy.herokuapp.com

From the dashboard you control nearly everything. The notable exceptions are

1. Heroku app variable (AKA environment variables), where you set very private data, such as your Steem posting key, username, email address, etc.
2. Automatic running of the bot. To run an iteration of your bot every ```X``` minutes, you need to use a scheduler. This is discussed in more detail in the [installation guide](/docs/installation.md).

## The Dashboard

![](/img/dashboard-active-session-1.png)

Through the dashboard you can access the various functions of the bot via a web interface.

In order to authenticate yourself, you need to supply your BOT_API_KEY into the clearly visible Start Session field. You set this API key when setting up the bot on Heroku or as an environment variable if a local install. It should not be confused with your Steem posting key, or SendGrid (email sender) API key.

![](/img/dashboard-active-session-2.png)

### Invalid session

If a session is invalid, either due to invalid or missing session key, or server idling or updating, you will see an error screen clearly directing you back to the dashboard.

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
 
#### General overview

![](/img/stats-overview-1.png)

#### Bot Run overview

![](/img/bot-run-overview-1.png)

![](/img/bot-run-overview-2.png)

![](/img/bot-run-overview-3.png)

#### Daily likes overview

![](/img/daily-likes-overview-1.png)

![](/img/daily-likes-overview-2.png)

![](/img/daily-likes-overview-3.png)

### 3. Edit Algorithm

![](/img/edit-algo-1.png)

### 4. Edit Config

![](/img/edit-config-1.png)

### 5. Test Algorithm

### 6. Last Log