import sinon = require("sinon");
import AwsSdk = require("aws-sdk");

import expect from "../../expect";

import LambdaScheduler from "../../../src/aws/lambda-scheduler";

describe("Lambda scheduler", () => {
    let awsStub: any;
    let lambda: any;
    let events: any;
    let bundle: any;

    let scheduler: LambdaScheduler;

    beforeEach(() => {
        lambda = {
            addPermission: sinon.stub().yields(null, {})
        };
        events = {
            putRule: sinon.stub().yields(null, {}),
            putTargets: sinon.stub().yields(null, {})
        };
        awsStub = {
            Lambda: sinon.stub().returns(lambda),
            CloudWatchEvents: sinon.stub().returns(events)
        };
        bundle = { generateAsync: sinon.stub() };

        scheduler = new LambdaScheduler(awsStub);
    });

    it("authenticates with the given credentials", async () => {
        scheduler.scheduleLambda("lambda-name", {
            accessKeyId: "test-access-key",
            secretAccessKey: "test-secret-access-key"
        });

        expect(awsStub.Lambda).to.have.been.calledWithMatch({
            credentials: {
                accessKeyId: "test-access-key",
                secretAccessKey: "test-secret-access-key"
            }
        });

        expect(awsStub.CloudWatchEvents).to.have.been.calledWithMatch({
            credentials: {
                accessKeyId: "test-access-key",
                secretAccessKey: "test-secret-access-key"
            }
        });
    });

    describe("when scheduling a lambda", () => {
        it("creates a new rule", async () => {
            await scheduler.scheduleLambda("arn:my-lambda", <any> {});

            expect(events.putRule).to.have.been.calledOnce;
            expect(events.putRule).to.have.been.calledWithMatch({
                Name: "dev-bot-trigger-my-lambda",
                ScheduleExpression: "rate(1 minute)"
            });
        });

        it("sets the new rule to trigger the lambda", async () => {
            events.putRule.yields(null, { RuleArn: "arn:newly-created-rule" });

            await scheduler.scheduleLambda("arn:my-lambda", <any> {});

            expect(events.putTargets).to.have.been.calledOnce;
            expect(events.putTargets).to.have.been.calledWithMatch({
                Rule: "arn:newly-created-rule",
                Targets: [{
                    Id: "dev-bot-target-my-lambda",
                    Arn: "arn:my-lambda"
                }]
            });
        });

        it("adds permissions to the lambda to allow triggering", async () => {
            events.putRule.yields(null, { RuleArn: "arn:newly-created-rule" });

            await scheduler.scheduleLambda("arn:my-lambda", <any> {});

            expect(lambda.addPermission).to.have.been.calledOnce;
            expect(lambda.addPermission).to.have.been.calledWithMatch({
                Action: "lambda.InvokeFunction",
                FunctionName: "arn:my-lambda",
                Principal: "events.amazonaws.com",
                SourceArn: "arn:newly-created-rule",
                StatementId: "1"
            });
        });
    });
});