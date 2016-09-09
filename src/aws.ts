import Zip = require("jszip");
import lambda = require("aws-lambda");

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
     context: lambda.Context,
     callback?: (err: Error, data: {}) => void): void;
}

export function pushBundleToAws(bundle: Zip, lambdaConfig: LambdaConfig, awsCredentials: AwsCredentials): string {
    throw new Error("Not yet implemented!");
}
