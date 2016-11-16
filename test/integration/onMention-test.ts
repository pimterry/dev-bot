import devBot = require("../../src/main");

import expect from "../expect";
import sinon = require("sinon");
import nock = require("nock");

// Limit sinon errors to 10 properties max
var formatter = require("formatio").configure({ quoteStrings: false, limitChildrenCount: 10 });
sinon.format = formatter.ascii.bind(formatter);

nock.disableNetConnect();

const BOT_NAME = "my-bot"
const BOT_MENTION = "@" + BOT_NAME;

describe("onMention", () => {
    let githubStub: nock.Scope;
    let botStub: any;

    beforeEach(() => {
        botStub = { onMention: sinon.stub() };
        githubStub = nock('https://api.github.com');

        githubStub.get('/user').query(true).optionally().reply(200, { login: BOT_NAME });

        notificationRequest = githubStub.put('/notifications').optionally().query(true);
        notificationRequest.reply(200);

        devBot.connectGithub({type:"oauth", token: "qwe"});
    });

    let notificationRequest: nock.Interceptor;
    let ignoredRequests = [];

    afterEach(() => {
        let pendingRequests = githubStub.pendingMocks()
                                        .filter((r) => ignoredRequests.indexOf(r) === -1);

        expect(pendingRequests).to.deep.equal([]);
        nock.cleanAll();
    });

    it("does nothing if there are no notifications", async () => {
        givenNotifications([]);
        await devBot.runBot(botStub);
        expect(botStub.onMention).not.to.have.been.called;
    });

    it("does nothing if there are only irrelevant notifications", async () => {
        givenNotifications([
            Object.assign(newCommentNotification(), { reason: "assign" }),
            Object.assign(newCommentNotification(), { subject: { type: "Other" } })
        ]);
        await devBot.runBot(botStub);
        expect(botStub.onMention).not.to.have.been.called;
    });

    it("calls onMention when you're mentioned on an issue", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ comment("testuser", BOT_MENTION + " hi there") ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).to.have.been.calledOnce;
    });

    it("calls onMention with the details of the comment @mentioning you", async () => {
        givenNotifications([ newCommentNotification() ]);
        let comments = [comment("testuser", BOT_MENTION + " hi there", "https://test-comment-url")];
        givenComments(comments);

        await devBot.runBot(botStub);

        let context = botStub.onMention.args[0][1];
        expect(botStub.onMention).to.have.been.calledWithMatch({
            user: "testuser",
            body: BOT_MENTION + " hi there",

            id: 1,
            url: "https://test-comment-url"
        }, {
            comments: sinon.match.array,

            id: 4,
            url: "https://api.github.com/repos/pimterry/dev-bot/issues/4",
            repo: {
                user: "pimterry",
                name: "dev-bot"
            }
        });
    });

    it("provides a callback to respond to a mention", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ comment("testuser", BOT_MENTION + " hi there") ]);

        await devBot.runBot(botStub);

        let callback = botStub.onMention.args[0][2];

        githubStub.post("/repos/pimterry/dev-bot/issues/4/comments", {
            "body": "Test message"
        }).query(true).reply(200);
        await callback("Test message");
    });

    it("calls onMention with only the comment mentioning you", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([
            comment("preceeding_user", "irreverant chatter"),
            comment("testuser", BOT_MENTION + " hi there"),
            comment("later_user", "more chatter")
        ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).to.have.been.calledOnce;
        expect(botStub.onMention).to.have.been.calledWithMatch({
            user: "testuser",
            body: BOT_MENTION + " hi there"
        });
    });

    it("ignores mentions of longer versions of the bot's name", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ comment("testuser", BOT_MENTION+"-v2") ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).not.to.have.been.called;
    });

    it("spots mentions without any following text", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ comment("testuser", BOT_MENTION) ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).to.have.been.calledOnce;
    });

    it("spots mentions with any following punctuation", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ comment("testuser", BOT_MENTION + "?") ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).to.have.been.calledOnce;
    });

    it("calls onMention repeatedly in order if multiple comments mention you", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([
            comment("userA", BOT_MENTION + " hi there"),
            comment("userB", BOT_MENTION + " more hellos!"),
        ]);

        await devBot.runBot(botStub);
        expect(botStub.onMention).to.have.been.calledTwice;
        expect(botStub.onMention).to.have.been.calledWithMatch({ user: "userA" });
        expect(botStub.onMention).to.have.been.calledWithMatch({ user: "userB" });
    });

    it("doesn't call onMention if we've already seen the comment", async () => {
        givenNotifications([ newCommentNotification("2016-01-01T01:00:00Z") ]);
        givenComments([
            comment("old-commenter", BOT_MENTION + " hi there", "",     "2016-01-01T00:00:00Z"),
            comment("new-commenter", BOT_MENTION + " more hellos!", "", "2016-01-01T02:00:00Z")
        ]);

        await devBot.runBot(botStub);

        expect(botStub.onMention).to.have.been.calledWithMatch({ user: "new-commenter" });
        expect(botStub.onMention).to.not.have.been.calledWithMatch({ user: "old-commenter" });
    });

    it("marks notifications from before the latest notification update as read", async () => {
        givenNotifications([ newCommentNotification("2016-01-01T01:00:00Z", "2016-01-01T01:30:00Z") ]);
        givenComments([
            comment("old-commenter", BOT_MENTION + " hi there", "",     "2000-01-01T00:00:00Z"),
            comment("new-commenter", BOT_MENTION + " more hellos!", "", "2010-01-01T02:00:00Z")
        ]);

        // Require the notification mark-as-read non-optionally, with exactly 01:30 (the last notification update time)
        nock.removeInterceptor(notificationRequest);
        githubStub.put('/notifications', {
            last_read_at: "2016-01-01T01:30:00Z"
        }).query(true).reply(200);

        await devBot.runBot(botStub);
    });

    it("doesn't call onMention for mentions after notification update time, to avoid races", async () => {
        givenNotifications([ newCommentNotification("2016-01-01T01:00:00Z", "2016-01-01T01:30:00Z") ]);
        givenComments([
            comment("race-condition", BOT_MENTION + " - after notification", "", "2016-01-01T02:00:00Z")
        ]);
        await devBot.runBot(botStub);

        expect(botStub.onMention).to.not.have.been.called;
    });

    it("does nothing if the comment has been deleted since notification", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ ]);

        await devBot.runBot(botStub);

        expect(botStub.onMention).not.to.have.been.called;
    });

    // TODO: Refactor our a nice helper for these.
    function givenNotifications(notifications: {}[]) {
        githubStub.get('/notifications').query(true).reply(200, notifications);
    }

    function givenComments(comments: {}[]) {
        githubStub.get(/\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments/)
                  .query(true)
                  .reply(200, comments);
    }
});

function notification(type: string, url: string, reason: string, lastRead: string, updatedAt: string) {
    return {
        unread: true,
        reason: reason,
        subject: {
            type: type,
            url: url
        },
        last_read_at: lastRead,
        updated_at: updatedAt
    };
}

// TODO: Refactor these to options objects to make their usage clearer

function newCommentNotification(lastRead: string = null, updatedAt: string = "2020-01-01T00:00:00Z") {
    return notification(
        "Issue",
        "https://api.github.com/repos/pimterry/dev-bot/issues/4",
        "mention",
        lastRead,
        updatedAt
    );
}

function comment(username: string, body: string, url: string = "", createdAt: string = "2020-01-01T00:00:00Z") {
    return {
        id: 1,
        user: { login: username },
        body: body,
        url: url,
        created_at: createdAt
    };
}
