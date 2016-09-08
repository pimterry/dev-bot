# DevBot

**DevBot is a framework to build chat-bot-based developer tooling.**

The goal of this is to let you quickly trigger or totally automate development tasks from the UI you have to hand when you start them: Github (or your other bug tracker).

Effortlessly build bots that can automatically file (and later close) issues when you commit a TODO, or bots that automatically close old issues for you. Build bots that monitor PRs and automatically mention the single relevant reviewer, mention the submitter when the PR is no longer mergable, or automatically walk developers through a CLA signing process. Build bots that you can @ mention on a PR to trigger a deploy (once the merged build has passed), or publish a package, or even bots you can ask to set up other bots or tools for you. Or just build bots to tell you jokes.

For a lot of us, our interactions within tools like Github are closely related to lots of the developer tasks we need to trigger, but we have to jump out to other tools (and often other larger devices) when we want to take the next steps. DevBots let you automate away developer tasks, with the simplest possible interface to go from developer discussion to action.

This has a big scope! Right now though, it's focused on two specific cases within this:

* Self-hosting your bots on AWS (principally Lambda)
* Interacting with your bots on Github.

In future it'd be great to expand the available hosts (to any lambda equivalents) and platforms (to Pivotal Tracker, Jira, Bitbucket, and Gerrit, more traditional chat platforms like Slack, and anywhere else developers interact with their code), but one step at a time.
