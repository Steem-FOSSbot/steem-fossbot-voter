# Ethos

### Privacy

We do not need a privacy policy, because we are not operating a service. Steem FOSSbot is a collection of software and we provide some suggestions as to how to use it. Your data will remain your own and you are encouraged to inspect the code to verify this.

Privacy and data protection are not often at the fore of online services, with often only lip service paid. Even the web industry standards and most common protection patterns take ownership out of your hands. With our software we aim to keep your data completely under your control.

Please see the [discussion doc page](/docs/discussion.md) for more information on how we do this.

### Ethos and goals

1. Completely free software. As open source software which is [licensed as creative commons](/license) (CC0), the code is free to use, modify, etc.
2. Completely free usage. Discounting your own costs, if any, the bot apps are free to run. Unlike many other Steem voting apps, **you are not required to give votes to the creator as payment**.
3. No managed user account, except what we need to host the server (i.e. Heroku). All access to the apps and bots is authenticated using API keys
4. You private keys are kept private and controlled by you. The creator does not store you keys on their server. Instead, they are stored on your own server which you create, giving you complete control and knowledge of their usage.
5. No tracking or data retention of any kind

## Comparison with other bots

_Note: When referencing a Steem user name, the @ symbol has been replaced with (at) so as not to notify users on GitHub._

I don't wish to detract from the excellent third party software being writen for Steem, all these efforts expand the usefulness of the system and show what is possible. I do wish to illustrate the differences between offerings, especially with regards to cost and data protection.

### Autosteem

[https://autosteem.learnthis.ca](https://autosteem.learnthis.ca)

A great one-stop-shop for Steem automation, as well as a wonderful new UI to replace Steemit.com with a more Wordpress type feel.

The scope of Autosteem is far beyond Steem FOSSbot, but the filtered, automatic voting is very similar to our offering.

#### Pros

1. Extremely good UI
2. Interactive filtering of posts for (auto)curation
3. Can use manual mode also

#### Cons

1. Will vote for every post by the app creator (at)unipsycho
2. Must create an account and trust the website with your private posting key

### Streemian

[https://streemian.com/](https://streemian.com/)

A collection of services to add to usability of Steem, including a "Curation Trail" service which includes automatic curated voting. The service seems to provide the ability to vote for all content posted by up to 5 authors.

The order of voting for all registered users is shuffled randomly, as voting time since post time greatly impacts curation reward. Additionally, you can pay the service a premium fee (currently $5 of Steem) to go much earlier in the voting queue.

The developer (at)chainsquad seems to assume that people will go for a blanket high gain strategy and follow whales, or authors you like to maximise cultural impact. With the authors list restricted to 5, I assume most people will go for high gain and simply follow whales.

#### Pros

1. Simple, easy to use service
2. Paying is optional

#### Cons

1. Very general curation without much control
2. Queued voting is an arbitrary constraint to funnel users to premium upgrade
1. Requires "social login", meaning a login on a mainstream social media website
2. The [privacy policy](https://streemian.com/privacy) states that **Steemian may track users** and collect personally identifying information. This is standard on web services today, but it is completely against our ethos