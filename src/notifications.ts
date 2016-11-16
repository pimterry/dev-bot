import moment = require("moment");
import GithubApi = require("github");

export default async function getNotifications(github: any) {
    let rawNotifications = await github.activity.getNotifications({
        participating: true
    });
    return new Notifications(github, rawNotifications);
}

class Notifications {
    constructor(private _github: any, private _notifications: Array<any>) { }

    get withMentions(): Array<any> {
        return this._notifications.filter((notification) => {
            return notification.unread === true &&
                   notification.reason === 'mention' &&
                   notification.subject.type === 'Issue';
        });;
    }

    get latestUpdateTime(): moment.Moment {
        let updateTimes = this._notifications.map((n) => moment(n.updated_at));
        return moment.max(...updateTimes).utc();
    }

    markAllAsRead(): Promise<void> {
        // Mark as read all the notification that we are holding.
        return this._github.activity.markNotificationsAsRead({
            last_read_at: this.latestUpdateTime.format()
        });
    }

    unsubscribeAll(): Promise<{}> {
        return Promise.all(this._notifications.map((notification) => {
            return this._github.activity.setNotificationThreadSubscription({
                id: notification.id,
                ignored: true
            });
        }));
    }
}
