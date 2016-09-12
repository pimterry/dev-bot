import docopt = require("docopt");

export interface CliArguments {
    action: CliAction;
    name: string;
    entrypoint: string;

    region: string;
    root: string;
    env?: string;
    role?: string;
}

export enum CliAction {
    AwsDeploy
}

const doc = `
Usage:
    dev-bot aws-deploy <name> <entrypoint> [--region=<region>] [--root=<root_directory>]
                                           [--role=<role_name>] [--env=deploy.env]
    dev-bot -h | --help

Options:
    -h, --help                Print this help message

    --region <region>         The AWS region to use [default: eu-west-1]
    --root <root_directory>   The bot's root directory [default: ./]
    --role <role_name>        The AWS role to use [default: create one automatically]
    --env <env-vars-file>     A dotenv file, containing environmental variables to inject at runtime
`;

export function parseArgs(argv: string[]): CliArguments {
    let result = docopt.docopt(doc, {
        argv: argv.slice(2),
        help: true,
        exit: false
    });

    return {
        action: result["aws-deploy"] ? CliAction.AwsDeploy : null,
        name: result["<name>"],
        entrypoint: result["<entrypoint>"],

        root: result["--root"] || "./",
        region: result["--region"] || "eu-west-1",
        env: result["--env"] || null,
        role: result["--role"] || null
    };
}
