import AwsSdk = require("aws-sdk");

import { AwsCredentials } from "./aws";
import { promisifyIam, PromisifiedIam } from "./promisify-aws";

export default class RoleCreator {
    constructor(private aws: (typeof AwsSdk)) {}

    private async getRole(iam: PromisifiedIam, name: string): Promise<string> {
        try {
            let response = await iam.getRole({ RoleName: name });
            return response.Role.Arn;
        } catch (e) {
            if (e.statusCode === 404) return null;
            else throw e;
        }
    }

    async createRole(name: string, awsCredentials: AwsCredentials): Promise<string> {
        let iam = promisifyIam(new this.aws.IAM({
            credentials: awsCredentials
        }));

        let existingRole = await this.getRole(iam, name);

        if (existingRole) return existingRole;
        else {
            let createRoleResult = await iam.createRole({
                RoleName: name,
                AssumeRolePolicyDocument: JSON.stringify({
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }]
                })
            });

            let roleArn = createRoleResult.Arn;

            await iam.putRolePolicy({
                RoleName: name,
                PolicyName: "default-dev-bot-policy",
                PolicyDocument: JSON.stringify({
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }]
                })
            });

            return roleArn;
        }
    }
}
