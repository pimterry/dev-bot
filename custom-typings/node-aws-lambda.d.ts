declare module "node-aws-lambda" {
    import AWS = require("aws-sdk");

    export interface AwsLambdaConfig {
        region: string;
        handler: string;
        functionName: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
        profile?: string; // load AWS creds from a profile

        role?: string;
        timeout?: number;
        memorySize?: number;
        publish?: boolean; // default: false,
        runtime?: string; // default: 'nodejs4.3',

        vpc?: {
            SecurityGroupIds: string[];
            SubnetIds: string[];
        }

        eventSource: {
            EventSourceArn: string;
            BatchSize: number;
            StartingPosition: "TRIM_HORIZON" | "LATEST";
        }
    }

    export function deploy(
        codePackage: string,
        config: AwsLambdaConfig,
        callback?: (err: Error) => void,
        logger?: (...msgs: string[]) => void,
        lambda?: AWS.Lambda
    ): void;
}
