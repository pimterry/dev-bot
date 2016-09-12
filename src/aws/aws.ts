import AwsSdk = require("aws-sdk");

import LambdaDeployer from "./lambda-deployer";
import RoleCreator from "./role-creator";

export interface AwsCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export var lambdaDeployer = new LambdaDeployer(AwsSdk);
export var roleCreator = new RoleCreator(AwsSdk);
