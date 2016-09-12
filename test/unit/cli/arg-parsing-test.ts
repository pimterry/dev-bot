import expect from "../../expect";

import { CliArguments, CliAction, parseArgs } from "../../../src/cli/arg-parsing";

function args(args: string[]): string[] {
    return [
        "/usr/local/bin/node",
        "/qwe/asd/def/node_modules/bin/dev-bot"
    ].concat(args);
}

describe("Arg parsing", () => {
    describe("for 'deploy'", () => {
        describe("when providing only the required arguments", () => {
            let result: CliArguments;
            beforeEach(() => result = parseArgs(args(["aws-deploy", "my-bot", "bot.js"])));

            it("sets the action to 'deploy", () => {
                expect(result.action).to.equal(CliAction.AwsDeploy);
            });

            it("gets the bot name", () => {
                expect(result.name).to.equal("my-bot");
            });

            it("gets the bot entrypoint", () => {
                expect(result.entrypoint).to.equal("bot.js");
            });

            it("has the region defaulting to eu-west-1", () => {
                expect(result.region).to.equal("eu-west-1");
            });

            it("has the root directory defaulting to ./", () => {
                expect(result.root).to.equal("./");
            });

            it("has the role defaulting to null", () => {
                expect(result.role).to.equal(null);
            });
        });

        describe("when providing optional arguments", () => {
            let result: CliArguments;
            beforeEach(() => result = parseArgs(args([
                "aws-deploy",
                "my-bot",
                "bot.js",
                "--region", "us-east-1a",
                "--root", "./src",
                "--role", "arn:aws:iam::account-id:role/role-name",
                "--env", "deploy-vars.env"
            ])));

            it("gets the bot name", () => {
                expect(result.name).to.equal("my-bot");
            });

            it("gets the bot entrypoint", () => {
                expect(result.entrypoint).to.equal("bot.js");
            });

            it("gets the region", () => {
                expect(result.region).to.equal("us-east-1a");
            });

            it("gets the root directory", () => {
                expect(result.root).to.equal("./src");
            });

            it("gets the role", () => {
                expect(result.role).to.equal("arn:aws:iam::account-id:role/role-name");
            });

            it("gets the env file", () => {
                expect(result.env).to.equal("deploy-vars.env");
            });
        });
    });
});
