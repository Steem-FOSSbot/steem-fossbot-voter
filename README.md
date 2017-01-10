# Voter

A Steem FOSSbot

**Please note that the bot is still in planning and development and is not yet functional.**

Documentaiton is [available here](/docs/index.md).

## What is this?

_Voter_ is a bot for Steem, built as a Node.js server and intended for deployment on Heroku or compatible.

For more information about the Steem FOSSbot ecosystem, check out [the doc on Steem FOSSbot](/docs/steemfossbot.md) and [our ethos](/docs/ethos.md).

## How it works

Please see the [discussion doc page](/docs/discussion.md) for and overview on how the curation algorithm works and how to use it to create a custom bot, as well as a discussion on bots on Steem in general. For technical details see the [algorithm and metrics doc page](/docs/algorithm.md)

## Usage

_Note, the dashboard is not currently functional, instead you'll find a placeholder webpage._

Open the bot dashboard using your Heroku app root URL, as above. All operations are available through the dashboard.

The operations you can perform are:

- Check bot status and stats
- Modify bot status (i.e. start / stop)
- Edit curation algorithm values and weight
- Run algorithm test

## Installation

_Note, the dashboard is not currently functional, instead you'll find a placeholder webpage._

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/evm2p/steem-fossbot-voter)

#### Create server

_Please be advised to read the Heroku [Terms of Service](https://www.heroku.com/policy/tos) and [Privacy Statement](https://www.heroku.com/policy/privacy) very carefully before creating an account._

_Also be advised that you may have to verify your Heroku account to use the add-ons which provide auto bot scheduling and email sending. Verifying can involve a bank card._

_Finally, there is a usage limit to the free account on Heroku which you should familiarise yourself with._

1. Create a Heroku account
2. Deploy this project to the Heroku using the Heroku Button above
3. Choose a name for your Voter bot (if you want) and click the _Deploy_ button
4. Set Configuration Variables. Note that without the required variables, the bot and server will not start.
	1. **STEEM_USER**, set to your user name, without a preceding "@" symbol.
	2. **POSTING_KEY_PRV**, set to your private Steemit posting key, used to cast votes
	3. **BOT_API_KEY**, set to any alphanumeric key you generate to grant access to your bot. Used to authenticate bot actions, such as start bot, as well as third party access.
	4. **EMAIL_ADDRESS_TO** (optional), set to your email address for notifications
	5. **EMAIL_ADDRESS_SENDER** (optional), set spoof email address for notification sender. Has no effect if EMAIL_ADDRESS_TO is not set
4. After the setup process finishes, click on the _Manage App_ button. If you view the server now it will not work as we haven't finished the set up yet.

You can always go to the _Resources_ tab in your Heroku Dashboard and change these variables any time. Each time you set a Config variable it restarts the server, so the change can take effect.

Open the bot dashboard to access your dashboard and confirm it works correctly. Use the root URL of your app as hosted on Heroku, e.g. https://voter.herokuapp.com

Now you can access your bot's settings using the bot dashboard. You'll be asked for the API key you set above to authenticate every time you perform an operation.

#### Configure bot to run periodically

**This a very important step.** To allow the Heroku "dyno" (app instance) to idle and not take up clock cycles, and so play by the rules with free accounts, we need to set a scheduled task which will run the bot periodally.

The **Heroku Scheduler** add-on was created with the app (if you had a verified account), so we'll add a scheduled task there with these steps:

1. Go to the _Resources_ tab in your Heroku Dashboard and click on the Heroku Scheduler to open its settings.
2. A new browser tab or window will open with the add-on settings.
3. Click the **Add new job** button
4. Type in ```node bot.js``` in to the text box
5. Set the frequency from _Daily_ to _Every 10 minutes_
6. Click the **Save** button

The task has now been created.

If you set an email address, when the bot runs for the first time after server restart, it you will get a notification.

#### (Optional) Set up email notifications

You can optionally use SendMail to send email notifications and summaries of your server and bot's activity. SendMail was chosen because it has a good add-on integration with Heroku, and seems respect data protection.

##### Note on SendGrid service integration

From their [Terms of Service](https://sendgrid.com/policies/tos/), section 13.2 (Content, Your Content)

> You retain all of Your rights in and to Your Content and do not convey any proprietary interest therein to SendGrid other than the licenses set forth herein.  You represent and warrant that none of Your Content violates this Agreement or the Email Policy or Privacy Policy.

And while the [Privacy Policy](https://sendgrid.com/policies/privacy/) does admit the usage of personally idenitfiable information, surrender is optional and advised thusly:

> YOU SHOULD NOT PROVIDE SENDGRID WITH ANY PERSONALLY IDENTIFIABLE INFORMATION [...] UNLESS YOU WOULD LIKE THAT INFORMATION TO BE USED IN ACCORDANCE WITH THIS POLICY.

> If you register for the Site or Services through a third-party, the personally identifiable information you have provided in connection with your registration may be imported into your account on for the Services. The personally identifiable information we may collect from you will also include any information imported from any such third-party.

We recommend you do not supply personal information to SendGrid (or any other service) and use email aliases, anonymous remailers or dead drops where possible. You should assume that any personally identifiable information supplied to Heroku is also shared with SendGrid.

##### Email set up

If you set up the optional EMAIL_ADDRESS_TO at least, and EMAIL_ADDRESS_SENDER if you want to also, you can set up email notifications. There are few more steps to get notifications fully set up.

You'll need an API key for SendGrid. Follow [this guide](https://devcenter.heroku.com/articles/sendgrid#obtaining-an-api-key) to set it up. You will access the add-on settings in the _Resources_ tab on the Heroku Dashboard, and click on the SendGrid add-on to do this.

After you have obtained an API key for SendGrid, go to the _Settings_ tab and click on _Reveal Config Vars button. Set the API key as the value for the variable **SENDGRID_API_KEY**.

## License and acknowledgements

All original programming is under the CC0 license and so it completely open and free to use in any capacity. It's in the spirit of the project that it is open to all.

The [steem Node.js package](https://www.npmjs.com/package/steem), used to access the Steem API, is available on NPM, and the [source is on GitHub](https://github.com/adcpm/steem).