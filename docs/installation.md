# Installation

This node server is designed to be flexible enough to run on a cloud service or locally on any machine. You also have the option of how to trigger bot updates (when the bot will run to process posts), either together on the cloud or by GET requesting a URI. 

## Locally (Desktop or Server)

The Docker can run on almost any device such as a server, desktop, laptop or phone. 
Installation instructions here: https://github.com/Steem-FOSSbot/voter-docker


## On Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/Steem-FOSSbot/steem-fossbot-voter)

### Create server

_Please be advised to read the Heroku [Terms of Service](https://www.heroku.com/policy/tos) and [Privacy Statement](https://www.heroku.com/policy/privacy) very carefully before creating an account._

_Also be advised that you may have to verify your Heroku account to use the add-ons which provide auto bot scheduling and email sending. Verifying can involve a bank card but at time of writing does not require any transaction to be made._

_Finally, there is a usage limit to the free account on Heroku which you should familiarise yourself with._

1. Create a Heroku account
2. Deploy this project to the Heroku using the Heroku Button above
3. Choose a name for your Voter bot (if you want)
4. Set Configuration Variables. Note that without the required variables, the bot and server will not start.
	1. **STEEM_USER**, set to your user name, without a preceding "@" symbol.
	2. **POSTING_KEY_PRV**, set to your private Steemit posting key, used to cast votes
	3. **BOT_API_KEY**, set to any alphanumeric key you generate to grant access to your bot. Used to authenticate bot actions, such as start bot, as well as third party access.
	4. **EMAIL_ADDRESS_TO** (optional), set to your email address for notifications
	5. **EMAIL_ADDRESS_SENDER** (optional), set spoof email address for notification sender. Has no effect if EMAIL_ADDRESS_TO is not set
	6. **SENDGRID_API_KEY** (optional), set to SendGrid API key, _which you will set up later_ if you want email notifications, so leave as default 'none' for now
	7. **COOKIE_SECRET** Change this to a random string to secure your sessions cookies, where your BOT_API_KEY will be stored in the browser. It doesn't matter what it is but make it **unique**.
	8. **VERBOSE_LOGGING** sets console logging to verbose if true, but is false by default as this will speed the bot run up somewhat. Leave off unless you are checking out an error or developing this software.
5. Click the _Deploy_ button
6. **Wait**, this process can take up to five minutes, do not refresh your browser.

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

If you set an email address, when the bot runs for the first time after server restart, it you will get a notification. Otherwise, you can visit this settings page again after an hour to confirm the script was run, as it shows the last time the scheduler was activated here.

### (Optional) Set up email notifications

You can optionally use SendMail to send email notifications and summaries of your server and bot's activity. SendMail was chosen because it has a good add-on integration with Heroku, and seems respect data protection.

#### Email set up

If you set up the optional EMAIL_ADDRESS_TO at least, and EMAIL_ADDRESS_SENDER if you want to also, you can set up email notifications. There are few more steps to get notifications fully set up.

You'll need an API key for SendGrid. Follow [this guide](https://devcenter.heroku.com/articles/sendgrid#obtaining-an-api-key) to set it up. You will access the add-on settings in the _Resources_ tab on the Heroku Dashboard, and click on the SendGrid add-on to do this.

After you have obtained an API key for SendGrid, copy it and go to the _Settings_ tab and click on _Reveal Config Vars_ button. Create a new variable called **SENDGRID_API_KEY** and set the SendGrid API key as the value.

##### Note on SendGrid service integration security and privacy

From their [Terms of Service](https://sendgrid.com/policies/tos/), section 13.2 (Content, Your Content)

> You retain all of Your rights in and to Your Content and do not convey any proprietary interest therein to SendGrid other than the licenses set forth herein.  You represent and warrant that none of Your Content violates this Agreement or the Email Policy or Privacy Policy.

And while the [Privacy Policy](https://sendgrid.com/policies/privacy/) does admit the usage of personally idenitfiable information, surrender is optional and advised thusly:

> YOU SHOULD NOT PROVIDE SENDGRID WITH ANY PERSONALLY IDENTIFIABLE INFORMATION [...] UNLESS YOU WOULD LIKE THAT INFORMATION TO BE USED IN ACCORDANCE WITH THIS POLICY.

> If you register for the Site or Services through a third-party, the personally identifiable information you have provided in connection with your registration may be imported into your account on for the Services. The personally identifiable information we may collect from you will also include any information imported from any such third-party.

We recommend you do not supply personal information to SendGrid (or any other service) and use email aliases, anonymous remailers or dead drops where possible. You should assume that any personally identifiable information supplied to Heroku is also shared with SendGrid.

## Updates and version migration

When there are bugfixes and other updates to this software, you can redeploy to Heroku in one of two ways

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
