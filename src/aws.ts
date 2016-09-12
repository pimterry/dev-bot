import promisify = require("es6-promisify");
import Zip = require("jszip");
import AwsSdk = require("aws-sdk");
import AwsLambda = require("aws-lambda");
import {
    promisifyLambda, PromisifiedLambda,
    promisifyIam, PromisifiedIam
} from "./promisify-aws";

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface LambdaConfig {
    functionName: string;
    handler: string;
    region: string;
    role?: string;
}

export interface LambdaHandler {
    (event: {},
     context: AwsLambda.Context,
     callback?: (err: Error, data: {}) => void): void;
}

export class AwsRoleCreator {
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
            let result = await iam.createRole({
                RoleName: name,
                AssumeRolePolicyDocument: JSON.stringify({
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                })
            });

            return result.Arn;
        }
    }
}

export class AwsDeployer {
    constructor(private aws: (typeof AwsSdk)) { }

    private async doesFunctionExist(lambda: PromisifiedLambda, name: string): Promise<boolean> {
        try {
            await lambda.getFunction({ FunctionName: name });
            return true;
        } catch (e) {
            if (e.statusCode === 404) return false;
            else throw e;
        }
    }

    async deployLambdaBundle(bundle: Zip, lambdaConfig: LambdaConfig, awsCredentials: AwsCredentials): Promise<void> {
        let lambda = promisifyLambda(new this.aws.Lambda({
            credentials: awsCredentials,
            region: lambdaConfig.region
        }));

        var name = lambdaConfig.functionName;
        let code = await bundle.generateAsync({type: "nodebuffer"});

        if (await this.doesFunctionExist(lambda, name)) {
            await lambda.updateFunctionCode({
                FunctionName: name,
                ZipFile: code
            });
            // Note that we *never* update lambda params - only the code.
        } else {
            await lambda.createFunction({
                FunctionName: name,
                Handler: lambdaConfig.handler,
                Publish: true,
                Role: lambdaConfig.role, // TODO - create a new role if one isn't provided (!)
                Runtime: "nodejs4.3",
                Description: "DevBot: " + name,
                Code: {
                    ZipFile: code
                }
            });
        }
    }
}
