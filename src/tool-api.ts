import AwsSdk = require("aws-sdk");
import { buildBundle } from "./bundle";
import { AwsCredentials, LambdaConfig, AwsDeployer } from "./aws";

export async function deploy(rootDirectory: string, // Absolute path to project
                             entryPoint: string, // Relative path in project to entrypoint
                             functionName: string,
                             region: string,
                             awsCredentials: AwsCredentials): Promise<void> {
    let bundle = await buildBundle({ rootDirectory, entryPoint });

    let deployer = new AwsDeployer(AwsSdk);
    await deployer.deployLambdaBundle(bundle, {
        functionName,
        region,
        handler: "dev-bot-handler.handler"
    }, awsCredentials);
}
