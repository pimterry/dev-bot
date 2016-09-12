declare module "aws-sdk" {
    export class IAM {
        constructor(options?: any);

        getRole(params: IAM.GetRoleParams, callback: (err: AwsError, data: any) => void): void;
        createRole(params: IAM.CreateRoleParams, callback: (err: AwsError, data: any) => void): void;
        putRolePolicy(params: IAM.PutRolePolicyParams, callback: (err: AwsError, data: any) => void): void;
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

        export interface PutRolePolicyParams {
            RoleName: string;
            PolicyName: string;
            PolicyDocument: string;
        }
    }

    export class CloudWatchEvents {
        constructor(options?: any);

        putRule(params: CloudWatchEvents.PutRuleParams, callback: (err: AwsError, data: any) => void): void;
        putTargets(params: CloudWatchEvents.PutTargetsParams, callback: (err: AwsError, data: any) => void): void;
        listRuleNamesByTarget(params: CloudWatchEvents.ListRuleNamesByTargetParams, callback: (err: AwsError, data: any) => void): void;
    }

    export module CloudWatchEvents {
        export interface PutRuleParams {
            Name: string;
            Description?: string;
            EventPattern?: string;
            ScheduleExpression?: string;
            RoleArn?: string;
            State?: "ENABLED"|"DISABLED";
        }

        export interface PutTargetsParams {
            Rule: string;
            Targets: {
                Arn: string;
                Id: string;
                Input?: string;
                InputPath?: string;
            }[]
        }

        export interface ListRuleNamesByTargetParams {
            TargetArn: string;
            Limit?: number;
            NextToken?: string;
        }
    }
}
