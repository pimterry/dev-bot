import moment = require("moment");
import GithubApi = require("github");
let github = GithubApi();

interface GithubAuthParams {
    type: "oauth";
    token: string;
}

export function connectGithub(params: GithubAuthParams) {
    github.authenticate(params);
}

export interface DevBotMention {
    user: string,
    body: string,
    created_at: string,

    id: number
    url: string
}

export interface DevBotMentionContext {
    comments: {
        id: number,
        user: { login: string },
        body: string,
        url: string,
        created_at: string
    }[],

    id: number,
    repo: {
        user: string,
        name: string,
    },
    url: string
}

export interface DevBotEntryPoint {
    onMention(mention: DevBotMention,
              context: DevBotMentionContext,
              respondCallback: (response: string) => Promise<void>): void;
}

export async function runBot(bot: DevBotEntryPoint): Promise<void> {
    let notifications = await github.activity.getNotifications({
        participating: true
    });

    // We use the latest notification update as our timestamp for what we mark-as-read
    let notificationReadTime = moment.max(notifications.map((n) => moment(n.updated_at)));
    github.activity.markNotificationsAsRead({
        last_read_at: notificationReadTime.utc().format()
    }).catch((err) => console.error(err)); // Separately log errors, don't wait for this request.

    let issueNotifications = notifications.filter((notification) => {
        return notification.unread === true &&
               notification.reason === 'mention' &&
               notification.subject.type === 'Issue';
    });

    if (issueNotifications.length > 0) {
        let username = (await github.users.get({})).login;

        await Promise.all(issueNotifications.map(async (notification) => {
            let lastRead = moment(notification.last_read_at || "2000-01-01T00:00:00Z");

            let issueUrl = notification.subject.url;
            let issueMatch = /api.github.com\/repos\/([\-\w]+)\/([\-\w]+)\/issues\/(\d+)/.exec(issueUrl);
            if (!issueMatch) {
                console.warn("Received issue notification that didn't match regex", issueUrl);
                return;
            }

            let repoUser = issueMatch[1];
            let repoName = issueMatch[2];
            let issueId = parseInt(issueMatch[3], 10);

            let comments = await github.issues.getComments({
                user: repoUser,
                repo: repoName,
                number: issueId
            });

            let newMentions = comments.filter((c) =>
                // Only mentions of this bot
                new RegExp("@"+username+"( |$)").test(c.body) &&
                // That we haven't seen
                moment(c.created_at).isAfter(lastRead) &&
                // Where we've seen the notification and marked it as read (so we avoid races)
                moment(c.created_at).isSameOrBefore(notificationReadTime)
            );

            for (let mention of newMentions) {
                bot.onMention({
                    user: mention.user.login,
                    body: mention.body,
                    created_at: mention.created_at,

                    url: mention.url,
                    id: mention.id
                },
                {
                    comments: comments,

                    id: issueId,
                    repo: {
                        user: repoUser,
                        name: repoName,
                    },
                    url: issueUrl
                }, function respondCallback(response: string) {
                    return github.issues.createComment({
                        user: repoUser,
                        repo: repoName,
                        number: issueId,
                        body: response
                    });
                });
            }
        }));

        // Unsubscribe, so we don't get non-mention updates to this thread in future.
        // We'd filter them anyway, but it avoids extra requests if we don't have to.
        await Promise.all(notifications.map((notification) => {
            return github.activity.setNotificationThreadSubscription({
                id: notification.id,
                ignored: true
            });
        }));
    } else {
        console.log("No outstanding notifications");
    }
}
