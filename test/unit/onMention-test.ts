import devBot = require("../../src/main");

import expect from "../expect";
import sinon = require("sinon");
import nock = require("nock");
nock.disableNetConnect();

const BOT_NAME = "my-bot"
const BOT_MENTION = "@" + BOT_NAME;

describe("onMention", () => {
    let githubStub: nock.Scope;
    let botStub: any;

    beforeEach(() => {
        botStub = { onMention: sinon.stub() };
        githubStub = nock('https://api.github.com');

        optionally(githubStub.get('/user').query(true)
                             .reply(200, { login: BOT_NAME }));

        devBot.connectGithub({type:"oauth", token: "qwe"});
    });

    let ignoredRequests = [];

    function optionally(request: nock.Scope) {
        ignoredRequests.push(Object.keys((<any>request).keyedInterceptors)[0]);
    }

    afterEach(() => {
        let pendingRequests = githubStub.pendingMocks()
                                        .filter((r) => ignoredRequests.indexOf(r) === -1);

        expect(pendingRequests).to.deep.equal([]);
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

    it("does nothing if the comment has been deleted since notification", async () => {
        givenNotifications([ newCommentNotification() ]);
        givenComments([ ]);

        await devBot.runBot(botStub);

        expect(botStub.onMention).not.to.have.been.called;
    });

    function givenNotifications(notifications: {}[]) {
        githubStub.get('/notifications').query(true).reply(200, notifications);
    }

    function givenComments(comments: {}[]) {
        githubStub.get(/\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments/)
                  .query(true)
                  .reply(200, comments);
    }
});

function notification(type: string, url: string, reason: string, lastRead: string) {
    return {
        unread: true,
        reason: reason,
        subject: {
            type: type,
            url: url
        },
        last_read_at: lastRead
    };
}

function newCommentNotification(lastRead: string = null) {
    return notification(
        "Issue",
        "https://api.github.com/repos/pimterry/dev-bot/issues/4",
        "mention",
        lastRead
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
