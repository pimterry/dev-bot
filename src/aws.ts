import promisify = require("es6-promisify");
import Zip = require("jszip");
import AwsSdk = require("aws-sdk");
import AwsLambda = require("aws-lambda");

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface LambdaConfig {
    functionName: string;
    handler: string;
    region: string;
}

export interface LambdaHandler {
    (event: {},
     context: AwsLambda.Context,
     callback?: (err: Error, data: {}) => void): void;
}

export class AwsDeployer {
    private lambda: AwsSdk.Lambda;

    constructor(aws: (typeof AwsSdk), awsCredentials: AwsCredentials) {
        this.lambda = new aws.Lambda({
            credentials: awsCredentials // TODO: Need to handle region here too
        });
    }

    async doesFunctionExist(name: string): Promise<boolean> {
        try {
            await promisify(this.lambda.getFunction)({
                FunctionName: name
            });
            return true;
        } catch (e) {
            if (e.statusCode === 404) return false;
            else throw e;
        }
    }

    async deployLambdaBundle(bundle: Zip, lambdaConfig: LambdaConfig): Promise<void> {
        var name = lambdaConfig.functionName;
        if (await this.doesFunctionExist(name)) {
            console.log(name);
            // Update it
        } else {
            await promisify(this.lambda.createFunction)({
                FunctionName: name,
                Handler: lambdaConfig.handler,
                Publish: true,
                Role: "TODO",
                Runtime: "nodejs4.3",
                Description: "DevBot: " + name,
                Code: {
                    ZipFile: (await bundle.generateAsync({type: "nodebuffer"}))
                }
            });
        }
    }
}
