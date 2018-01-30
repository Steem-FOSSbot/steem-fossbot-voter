# Ethos

### Privacy

We do not need a privacy policy, because we are not operating a service. Steem FOSSbot is a collection of software and we provide some suggestions as to how to use it. Your data will remain your own and you are encouraged to inspect the code to verify this.

Privacy and data protection are not often at the fore of online services, with often only lip service paid. Even the web industry standards and most common protection patterns take ownership out of your hands. With our software we aim to keep your data completely under your control.

We do not use CDN (content delivery networks) to fetch commonly used services, such as jQuery or Google Fonts API, with the exception of NPM (look at their [privacy policy](https://docs.npmjs.com/policies/privacy) to make sure you're happy about that). Why this matters is that CDNs, especially those run by Google, are well known to track usage and can be a subtle and hidden addition to their already extensive tracking programme.

Please see the [discussion doc page](/docs/discussion.md) for more information on how your information is protected.

### Ethos and goals

#### 1. Excellent algorithm

To the best of our knowledge, this bot is the most flexible and intelligent bot freely available for use. The potential bot configurations are endless.

No other bot uses NLP processing, article type inference, and wide use of statistics, not only about the post but about the author and those who've already voted on it.

#### 2. Completely free software

As open source software which is [licensed as creative commons](/license) (CC0), the code is free to use, modify, etc., without restriction.

#### 3. Completely free usage

Discounting your own costs, if any, the bot apps are free to run. Unlike many other Steem voting apps, **you are not required to give votes to the creator as payment**, and there is no freemium or premium services.

#### 4. No managed user account

Except what we need to host the server (i.e. Heroku), you do not need to create any account. (Soon you will be able to run this locally on your desktop or Raspberry PI).

All access to the apps and bots is authenticated using an API keys which you set. Your private keys are kept private and controlled by you. The creator of this software, does not store you keys on their server. Instead, they are stored on your own server which you create, giving you complete control and knowledge of their usage.

#### 5. No tracking or data retention of any kind

We take the idea of Do Not Track seriously. There is no social media login, no analytics platform, nothing. You can deploy the server to Heroku without so much as a whisper to us.

However, of course we have no control over if and how third parties may track you. We are developing the local install support soon so you can stay completely away from third party services, except NPM. As mentioned above, we do not even use CDNs.
