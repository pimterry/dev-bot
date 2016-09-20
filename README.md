# DevBot [![Build Status](https://travis-ci.org/pimterry/dev-bot.png)](https://travis-ci.org/pimterry/dev-bot)

**DevBot is a framework to build chat-bot-based developer tooling.**

The goal of this is to let you quickly trigger or totally automate development tasks from the UI you have to hand when you start them: Github (or your other bug tracker).

Effortlessly build bots that can automatically file (and later close) issues when you commit a TODO, or bots that automatically close old issues for you. Build bots that monitor PRs and automatically mention the single relevant reviewer, mention the submitter when the PR is no longer mergable, or automatically walk developers through a CLA signing process. Build bots that you can @ mention on a PR to trigger a deploy (once the merged build has passed), or publish a package, or even bots you can ask to set up other bots or tools for you. Or just build bots to tell you jokes.

For a lot of us, our interactions within tools like Github are closely related to lots of the developer tasks we need to trigger, but we have to jump out to other tools (and often other larger devices) when we want to take the next steps. DevBots let you automate away developer tasks, with the simplest possible interface to go from developer discussion to action.

This has a big scope! Right now though, it's focused on a certain specific niche within this:

* Interacting with your bots on Github.
* Writing your bots in Node.

In future it'd be great to expand the platforms (to Pivotal Tracker, Jira, Bitbucket, and Gerrit, more traditional chat platforms like Slack, and anywhere else developers interact with their code) and languages (suggestions welcome! Python?). One step at a time though.

## Get Started

*This doesn't all work yet - this is the plan*.

DevBot handles all the platform integration for you, and the [DevBot tool](https://github.com/pimterry/dev-bot-tool) handles all the deployment and hosting integration. All you need to do is expose an interface for the events you'd like to handle (mentions, pull requests, etc), run whatever code you'd like (either with standard libraries or using DevBot's API for actions like replying on a comment thread), and use the DevBot CLI tool to test your bot locally or to push it to AWS (or run it yourself, of course).

First you need to install DevBot:

```bash
npm install --save dev-bot
```

*(If you want to run the entire example below, you'll also want 'jokes').*

You then need to write a bot that connects to a platform, and responds to some events. Let's walk through an example bot (see the full source at https://github.com/jokebot/jokebot) that responds to Github @mentions with jokes:

```javascript
var getJoke = require("jokes");
var devBot = require("dev-bot");

devBot.connectGithub({
    type: "oauth",
    token: process.env.GITHUB_TOKEN
});

exports.onMention = function (mention, respondCallback) {
    respondCallback(getJoke().text);
}
```

Feel free to @jokebot on an issue on the [jokebot repo](https://github.com/jokebot/jokebot) to try this out. The above is the entire source. Neat!

First, we do some standard require()ing, then we set up Github with our credentials, and then we provide a handler for mentions. That handler is given the data for the mention, but we don't even need that here, we just use the second argument (a callback you can use to easily reply directly to your mention), and pass it a joke from our joke source. That's the lot.

To actually deploy this, you'll need AWS credentials available, and the DevBot tool installed (`npm install --save-dev dev-bot-tool`). See the tool's [full readme](https://github.com/pimterry/dev-bot-tool/blob/master/README.md) for more information. For a larger project you'll want to create a .env file in your repo (**remember to .gitignore it!**) to hold your AWS credentials, and load them with `source .env` before your commands, but to test this you can just run:

```bash
export AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAA
export AWS_SECRET_ACCESS_KEY=BBBBBBBBBBBBBBBBBBBBBBBBBBBBB

dev-bot aws-deploy --name jokebot index.js
```

Note that the above will only work with `dev-bot` in your path. You can install it globally, but typically instead I install it locally in my bots, and run the above from NPM scripts (which automatically include ./node_modules/bin to their path, where DevBot puts its CLI client). See JokeBot's [package.json](https://github.com/jokebot/jokebot/blob/master/package.json) for an example of this all put together.

That's it! Do whatever you like inside onMention, and see it called every time somebody pings you (with a short delay: see [caveats](#caveats) below).

## Caveats

* Github's notification API doesn't let you poll more than once a minute, so notification-based events (as opposed to webhooks) aren't instant. On average you're going to wait 30s, which is normally enough for most things, but does mean you'll struggle for conversations that have a lot of back and forth. This doesn't affect events with webhooks support (like pull request creation). I'm interested in ways to improve this though - open an issue here if you have an idea!
