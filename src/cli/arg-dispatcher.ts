import { CliArguments, CliAction } from "./arg-parsing";
import { AwsCredentials } from "../aws";

import { deploy } from "./cli-api";

export async function runCommand(args: CliArguments): Promise<void> {
    let credentials: AwsCredentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

    if (args.action === CliAction.AwsDeploy) {
        console.log(`Deploying ${args.name} to AWS`);

        return deploy(
            args.root,
            args.entrypoint,
            args.name,
            args.region,
            args.role,
            credentials
        );
    } else {
        throw new Error("Unrecognized CLI action");
    }
}
