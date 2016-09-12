declare module "aws-sdk" {
    export class IAM {
        constructor(options?: any);

        getRole(params: IAM.GetRoleParams, callback: (err: AwsError, data: any) => void): void;
        createRole(params: IAM.CreateRoleParams, callback: (err: AwsError, data: any) => void): void;
    }

    export module IAM {
        export interface GetRoleParams {
            RoleName: string;
        }

        export interface CreateRoleParams {
            RoleName: string;
            AssumeRolePolicyDocument: string;
            Path?: string;
        }
    }
}
