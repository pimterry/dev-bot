import AwsSdk = require("aws-sdk");

import LambdaDeployer from "./lambda-deployer";
import LambdaScheduler from "./lambda-scheduler";
import RoleCreator from "./role-creator";

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export var lambdaDeployer = new LambdaDeployer(AwsSdk);
export var lambdaScheduler = new LambdaScheduler(AwsSdk);
export var roleCreator = new RoleCreator(AwsSdk);
