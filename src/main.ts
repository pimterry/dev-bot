import moment = require("moment");
import GithubApi = require("github");

import getNotifications from "./notifications";
import Thread from "./thread";
import Repo from "./repo";

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

export interface DevBotEntryPoint {
    onMention(mention: DevBotMention,
              context: Thread,
              respondCallback: (response: string) => Promise<void>): void;
}

export async function runBot(bot: DevBotEntryPoint): Promise<void> {
    let notifications = await getNotifications(github);
    notifications.markAllAsRead().catch((e) => console.error(e)); // Log errors, but don't wait for this request.

    if (notifications.withMentions.length === 0) {
        console.log("No outstanding notifications");
        return;
    }

    let username = (await github.users.get({})).login;

    await Promise.all(notifications.withMentions.map(async (notification) => {
        let lastRead = moment(notification.last_read_at || "2000-01-01T00:00:00Z");
        let thread = await new Thread(github, notification.subject.url);

        let newMentions = thread.comments.filter((c) =>
            // Only mentions of this bot
            new RegExp("@"+username+"([^a-zA-Z0-9\-]|$)").test(c.body) &&
            // That we haven't seen
            moment(c.created_at).isAfter(lastRead) &&
            // Where we've seen the notification and marked it as read (so we avoid races)
            moment(c.created_at).isSameOrBefore(notifications.latestUpdateTime)
        );

        for (let rawMention of newMentions) {
            let mention = {
                user: rawMention.user.login,
                body: rawMention.body,
                created_at: rawMention.created_at,

                url: rawMention.url,
                id: rawMention.id
            };

            bot.onMention(mention, thread, (msg) => thread.comment(msg));
        }
    }));

    // Unsubscribe, so we don't get non-mention updates to this thread in future.
    // We'd filter them anyway, but it avoids extra requests if we don't have to.
    await notifications.unsubscribeAll();
}
