# DevBot [![Build Status](https://travis-ci.org/pimterry/dev-bot.png)](https://travis-ci.org/pimterry/dev-bot)

**DevBot is a framework to build chat-bot-based developer tooling.**

The goal of this is to let you quickly trigger or totally automate development tasks from within the Github UI. With this you can essentially extend Github however you like, to build new behavior and UI into issues, PRs, and anywhere else.

Easily build bots that can automatically file (and later close) issues when you commit a TODO, or bots that automatically close old issues for you. Build bots that monitor PRs and automatically mention the single relevant reviewer, mention the submitter when the PR is no longer mergable, or automatically walk developers through a CLA signing process. Build bots that you can @ mention on a PR to trigger a deploy (once the merged build has passed), or publish a package, or even bots you can ask to set up other bots or tools for you. Or just build bots to tell you jokes.

For a lot of us, our interactions within Github are closely related the next developer tasks we need to trigger, and or the other tools we need to use. We have to jump out of Github to other sites and tools though (and often only on other larger devices) when we want to take those next steps.

DevBots let you automate away developer tasks, with the simplest possible interface to go from discussion or code change to action.

## Current Status

This project is in the early stages, but now has enough working support for you to build some interesting bots.

Right now, you can easily build bots that will listen for any @ mentions of their username on Github, run any other general node logic you'd like, and respond. The [DevBot tool](https://github.com/pimterry/dev-bot-tool) allows you to quickly do single test runs of these bots locally, and to automatically deploy and setup these bots on AWS Lambda (where at least your first 10 or so bots are essentially free to run).

Soon bots will also be able to respond immediately to new pull requests or issues on repositories they've been subscribed to, and will gain the tools to analyse and interact with the code for these. See the [future plans](#the-future) section below for more details.

## Get Started

DevBot handles all the platform integration for you, and the [DevBot tool](https://github.com/pimterry/dev-bot-tool) handles all the deployment and hosting integration. All you need to do is expose an interface for the events you'd like to handle (mentions, pull requests, etc), run whatever code you'd like (either with standard libraries or using DevBot's API for actions like replying on a comment thread), and use the DevBot CLI tool to test your bot locally or to push it to AWS (or run it yourself, of course).

First you need to install DevBot:

```bash
npm install --save dev-bot
```

*(If you want to run the entire example below directly, you'll also want `jokes`).*

You then need to write a bot that connects to a platform, and responds to some events. Let's walk through an example bot (see the full source at https://github.com/jokebot/jokebot) that responds to Github @mentions with jokes:

```javascript
var getJoke = require("jokes");
var devBot = require("dev-bot");

devBot.connectGithub({
    type: "oauth",
    token: process.env.GITHUB_TOKEN // Read secrets from the environment, rather than including them directly
});

exports.onMention = function (mention, respondCallback) {
    respondCallback(getJoke().text);
}
```

Feel free to @jokebot on an issue on the [jokebot repo](https://github.com/jokebot/jokebot), or anywhere else on Github, to try this out. The above is the entire source. Neat!

First, we do some standard require()ing, then we set up Github with our credentials, and then we provide a handler for mentions. That handler is given the data for the mention, but we don't even need that here, we just use the second argument (a callback you can use to easily reply directly to your mention), and pass it a joke from our joke source. That's the lot.

With that saved as index.js and the DevBot tool installed (`npm install -g dev-bot-tool`), we can run this locally:

```bash
export GITHUB_TOKEN=abcdefghijklmnop
dev-bot run-once index.js
```

This runs the bot once for testing. It checks for any mentions, reacts to them (i.e. responds with a joke), and then stops.

Note that here we've installed `dev-bot-tool` globally. That's fine for a quick demo, but typically instead I would install it locally as a dependency within a project (`npm install --save-dev dev-bot-tool`), and then define commands in npm scripts with the relevant arguments for your configuration pre-prepared. See JokeBot's [package.json](https://github.com/jokebot/jokebot/blob/master/package.json) for an example of this all put together.

To go further you'll want to deploy this. To do so, you'll need AWS credentials available. For a larger project you'll want to create a .env file in your repo (**and remember to .gitignore it!**) to hold your AWS credentials, and load them with `source .env` before your commands. For a quick test though you can just run:

```bash
# These variables are used now when deploying
export AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAA
export AWS_SECRET_ACCESS_KEY=BBBBBBBBBBBBBBBBBBBBBBBBBBBBB

# The contents of deploy.env are added to the deployed environment.
# This lets the bot use the github token at runtime.
echo "GITHUB_TOKEN=CCCCCCCCCCCCCCCC" > deploy.env

dev-bot aws-deploy jokebot index.js --env deploy.env
```

That's it! Do whatever you like inside onMention, and see it called every time somebody pings you (with a short delay: see [caveats](#caveats) below).

## Caveats

* Github's notification API doesn't let you poll more than once a minute, so notification-based events (as opposed to webhooks) aren't instant. On average you're going to wait 30s, which is normally enough for most things, but does mean you'll struggle for conversations that have a lot of back and forth. This doesn't affect events with webhooks support (like pull request creation). I'm interested in ways to improve this though - open an issue here if you have an idea!
* AWS Lambda comes with [some limitations](http://docs.aws.amazon.com/lambda/latest/dg/limits.html). Your deployment has a 50MB zipped-size limit (which can make using large dependencies difficult, although there's [solutions coming](https://github.com/pimterry/dev-bot/issues/32)), and you have a 5 minute execution time limit. For complex or larger applications, Lambda probably isn't where you should run your code: run on Lambda and trigger a service elsewhere, or get a proper EC2 instance, and run DevBot there by hand.

## The Future

### Planned features

* Web hooks for PRs and issues (#11)
* Built-in support for examining the code of a PR (#16)
* Faster message notification (#31)
* Built-in tools to configure a bot for a new repo (#15)
* Built-in tools to authenticate @ mentioning users (#34)
* Yeoman generator for quickly creating new bots (#33)

### Other platforms, languages, and deployment targets.

In general, this has a big scope! Right now though, it's focused on a certain specific niche within this:

* Interacting with your bots on Github.
* Writing your bots in Node.
* Deploying them either locally or on AWS Lambda.

In future it'd be great to expand the platforms (to Pivotal Tracker, Jira, Bitbucket, and Gerrit, more traditional chat platforms like Slack, and anywhere else developers interact with their code), languages (suggestions welcome! Python?) and deployment targets (Azure, Google Cloud Functions, etc). This is early days though, the above covers a lot of the most interesting cases very easily, and we'll be taking the long-term future one step at a time.