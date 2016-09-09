import { buildBundle } from "./bundle";
import { AwsCredentials, LambdaConfig, pushBundleToAws } from "./aws";

export async function deploy(rootDirectory: string, // Absolute path to project
                             entryPoint: string, // Relative path in project to entrypoint
                             functionName: string,
                             region: string,
                             awsCredentials: AwsCredentials): Promise<void> {
    let bundle = await buildBundle({ rootDirectory, entryPoint });
    await pushBundleToAws(bundle, {
        functionName,
        region,
        handler: "dev-bot-entrypoint.handler"
    }, awsCredentials);
}
