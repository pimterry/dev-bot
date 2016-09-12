import AwsSdk = require("aws-sdk");

import { AwsCredentials } from "./aws";
import { promisifyEvents, promisifyLambda } from "./promisify-aws";

export default class LambdaScheduler {
    constructor(private aws: (typeof AwsSdk)) { }

    async scheduleLambda(lambdaArn: string, region: string, credentials: AwsCredentials) {
        let events = promisifyEvents(new this.aws.CloudWatchEvents({ credentials, region }));
        let lambda = promisifyLambda(new this.aws.Lambda({ credentials, region }));

        let name = lambdaArn.split(":").slice(-1)[0];

        let existingRules = (await events.listRuleNamesByTarget({ TargetArn: lambdaArn})).RuleNames;
        if (existingRules.length > 0) return;

        let rule = await events.putRule({
            Name: `dev-bot-trigger-${name}`,
            ScheduleExpression: "rate(1 minute)"
        });

        await lambda.addPermission({
            Action: "lambda:InvokeFunction",
            FunctionName: lambdaArn,
            Principal: "events.amazonaws.com",
            SourceArn: rule.RuleArn,
            StatementId: `dev-bot-stmt-${Date.now()}`
        });

        await events.putTargets({
            Rule: `dev-bot-trigger-${name}`,
            Targets: [{
                Id: `dev-bot-target-${name}`,
                Arn: lambdaArn
            }]
        });
    }
}
