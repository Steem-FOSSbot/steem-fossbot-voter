# Installation

This node server is designed to be flexible enough to run on a cloud service or locally on any machine. You also have the option of how to trigger bot updates (when the bot will run to process posts), either together on the cloud or by GET requesting a URI.

## Locally (Desktop or Server)

The Docker can run on almost any device such as a server, desktop, laptop or phone.
Installation instructions here: https://github.com/Steem-FOSSbot/voter-docker

**Note the Docker deployment is currently out of date at v0.2.10, to be updated soon.**


## On Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/Steem-FOSSbot/steem-fossbot-voter)

### Create server

_Please be advised to read the Heroku [Terms of Service](https://www.heroku.com/policy/tos) and [Privacy Statement](https://www.heroku.com/policy/privacy) very carefully before creating an account._

_There is a usage limit to the free account on Heroku which you should
familiarise yourself with._

#### Important - Heroku requires credit or bank card and person details for sign up

Be advised that you may have to verify your Heroku account to use the
add-ons which provide auto bot scheduling. Verifying
involves a bank card but at time of writing does not require any transaction
to be made.

If you are not comfortable with this you can try a local install instead
or use a different service such as OpenShift. However at this time I do
not have installation instructions for any other platform.

#### Generating a BOT_API_KEY

Before continuing you will need to generate a ```BOT_API_KEY```. This can
 be any kind of series of letters and numbers, e.g. ```asdliHSFH38fif8s```

It is used to "log in" to your bot on the web app interface. It's
important because it is your way to change settings, etc. You could also
safely share it with a third party who can access it from the internet but
they would not able to access you private keys, just the bot, so it's
handy.

I advise you set a randomly generated key. If you are on Linux or Mac and
 have OpenSSL installed you can use the following command.

```openssl rand 24 -hex```

Otherwise you can generate it with a password manager, etc. I would not
recommend using a website service though, you should generate it locally.

#### The steps

1. Create a Heroku account
2. Deploy this project to the Heroku using the Heroku Button above
3. Choose a name for your Voter bot (if you want)
4. Set Configuration Variables. Note that without the required variables, the bot and server will not start.
	1. **STEEM_USER**, set to your user name, without a preceding "@" symbol.
	2. **POSTING_KEY_PRV**, set to your private Steemit posting key, used to cast votes
	3. **BOT_API_KEY**, set to any alphanumeric key you generate to grant access to your bot. Used to authenticate bot actions, such as start bot, as well as third party access.
	4. **COOKIE_SECRET** Change this to a random string to secure your sessions cookies, where your BOT_API_KEY will be stored in the browser. It doesn't matter what it is but make it **unique**.
	5. **VERBOSE_LOGGING** sets console logging to verbose if true, but is false by default as this will speed the bot run up somewhat. Leave off unless you are checking out an error or developing this software.
5. Click the _Deploy_ button
6. **Wait**, this process can take up to five minutes.

After the app finishes deploying as a server, you can view the dashboard by clicking the **View ->** button and confirm it was set up correctly. Use the root URL of your app as hosted on Heroku, e.g. https://voter.herokuapp.com

##### Please note

You can always go to the _Settings_ tab in your Heroku Dashboard and change these variables any time. Each time you set a Config variable it restarts the server, so the change can take effect.

Please see the usage information above this section for more information about the dashboard.

### IMPORTANT! Configure bot to run periodically

Heroku apps use server components called "dynos" will idle after a certain amount of time, and so we cannot run a continuous code loop on this server. However in order to run our curation bot **we need to set a scheduled task which will run the bot periodally**.

The **Heroku Scheduler** add-on was created with the app (if you had a verified account), so we'll add a scheduled task there with these steps:

1. Go to the _Resources_ tab in your Heroku Dashboard and click on the Heroku Scheduler to open its settings.
2. A new browser tab or window will open with the add-on settings.
3. Click the **Add new job** button
4. Type in ```node bot.js``` in to the text box
5. Set the frequency from _Daily_ to _Every Hour_
6. Click the **Save** button

The task has now been created.

#### Note, Scheduler is "best effort"

The Heroku Scheduler add-on is a "best effort" service and may not run every time it is supposed to.

From their docs:

> Scheduler is a “best effort” service, meaning that execution is expected but not guaranteed. Scheduler is known to occasionally (but rarely) miss the execution of scheduled jobs. If scheduled jobs are a critical component of your application, it is recommended to run a custom clock process instead for more reliability, control, and visibility.

In my experience it is _quite_ reliable but it does miss the occasional
call or delay it.

## Updates and version migration

**IMPORTANT for upgrade to v0.3.0**

Since the database was changed to MongoDB as per #64, you must do a clean reinstall for the bot to work correct. BEFORE YOU DO THIS you should export both your algorithm and you config, and then import to the app again using the interfaces in Edit Algo and Edit Config web app sections.

### Usual update instructions

In general, when there are bugfixes and other updates to this software, you can redeploy to Heroku in one of two ways

#### 1. Fork your own version

This is the preferred option, but you'll need a GitHub account to do it (unless you want to manually set up a different repo with the Heroku CLI, but if you know this much you already know how to do it).

Follow these steps

##### Set up GitHub to Heroku deployments

_Note, you only need to do this once_

1. Create a GitHub account, if you don't already have one
2. Fork this project (if you don't know how, see [this guide](https://help.github.com/articles/fork-a-repo/)).
3. On Heroku, go to the _Deploy_ tab for you project, and follow the instructions to link you GitHub account to your Heroku project for this bot.
4. Search for ```steem-fossbot-voter``` and add access to it to your deployment
5. You should set it up for automatic deployment on master branch, just click the clearly labelled button

##### Sync your fork with the main project

Every time there is an release update (or sooner on the develop branch) you should sync your fork with the main project repository.

This brings your fork up to date with the main project.

You can either do this with the command line, but I would recommend you use the [GitHub Desktop Client](https://desktop.github.com/)

Just choose the Sync option in the Repository menu.

_Please ignore the files in the screenshot, it's just a random repo!_

![](/img/github-desktop-sync.png)

##### Deploy your fork

If you set your GitHub project access in Heroku to automatically deploy from master branch, the deployment process will happen automatically. You can check this in the _Activity_ tab of your Heroku dashboard, but be aware deployment can take several minutes.

If you did not, you'll need to go back to your _Deploy_ tab on the Heroku dashboard and manually deploy. This option is at the bottom of the webpage.

#### 2. Reinstall the bot

Less desirable, but much simpler, is to just delete the server and re-deploy it. Just delete it and follow the installation instructions again.

Don't forget to export both your configuration (accessed in Edit Config) and your algorithm (accessed in Edit Algorithm section).
