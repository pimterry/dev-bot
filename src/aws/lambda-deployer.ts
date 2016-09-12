import Zip = require("jszip");
import AwsSdk = require("aws-sdk");
import AwsLambda = require("aws-lambda");

import { AwsCredentials } from "./aws";
import { promisifyLambda, PromisifiedLambda } from "./promisify-aws";

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

export default class LambdaDeployer {
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

    async deployLambdaBundle(bundle: Zip, lambdaConfig: LambdaConfig, awsCredentials: AwsCredentials): Promise<string> {
        let lambda = promisifyLambda(new this.aws.Lambda({
            credentials: awsCredentials,
            region: lambdaConfig.region
        }));

        var name = lambdaConfig.functionName;
        let code = await bundle.generateAsync({type: "nodebuffer"});

        if (await this.doesFunctionExist(lambda, name)) {
            let response = await lambda.updateFunctionCode({
                FunctionName: name,
                ZipFile: code
            });
            return response.FunctionArn;
            // Note that we *never* update lambda params - only the code.
        } else {
            let response = await lambda.createFunction({
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

            return response.FunctionArn;
        }
    }
}
