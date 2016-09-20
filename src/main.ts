import github = require("github");

interface GithubAuthParams {
    type: "oauth";
    token: string;
}

export function connectGithub(params: GithubAuthParams) {
    github.authenticate(params);
}

export interface DevBotMention {
    url: string;
}

export interface DevBotEntryPoint {
    onMention(mention: DevBotMention, respondCallback: (response: string) => Promise<void>): void;
}

export async function runBot(bot: DevBotEntryPoint) {
    let notifications = await github.activity.getNotifications()

    if (notifications.length > 0) {
        let issueMentions = notifications.filter((notification) => {
            return notification.unread === true &&
                   notification.reason === 'mention' &&
                   notification.subject.type === 'Issue';
        });

        await Promise.all(issueMentions.map((notification) => {
            let issueUrl = notification.subject.url;
            let issueMatch = /api.github.com\/repos\/([\-\w]+)\/([\-\w]+)\/issues\/(\d+)/.exec(issueUrl);
            if (issueMatch) {
                let issueUsername = issueMatch[1];
                let issueRepo = issueMatch[2];
                let issueId = issueMatch[3];

                bot.onMention({
                    url: issueUrl
                }, function respondCallback(response: string) {
                    return github.issues.createComment({
                        user: issueUsername,
                        repo: issueRepo,
                        number: issueId,
                        body: response
                    });
                });
            }
        }));

        // Think there's a small but possible race condition here, if Github gets a new message between
        // getNotifications and unsubscribing here on the same thread, but I don't have an easy fix right now.
        await Promise.all(notifications.map((notification) => {
            return github.activity.setNotificationThreadSubscription({
                id: notification.id,
                ignored: true
            });
        }).concat(notifications.map((notification) => {
            return github.activity.markNotificationThreadAsRead({ id: notification.id });
        })));
    }
}
