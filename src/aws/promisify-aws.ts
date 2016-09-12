import AwsSdk = require("aws-sdk");
import promisify = require("es6-promisify");

/*
 * This bit's a little crazy and nasty. We go through an entire given Lambda object, and wrap
 * every method dynamically with promisify(x.bind(lambda)), so we can promise everything.
 *
 * This code is terrible and sad, but it makes the rest of the code delightful to work with.
 * Should be able to delete this once the AWS Lambda API supports promises properly.
 */

// Taken straight from DefinitelyTyped's AWS Lambda class definition, transformed to Promises.
export interface PromisifiedLambda {
    endpoint: AwsSdk.Endpoint;
    addPermission(params: AwsSdk.Lambda.AddPermissionParams): Promise<any>;
    createAlias(params: AwsSdk.Lambda.CreateAliasParams): Promise<any>;
    createEventSourceMapping(params: AwsSdk.Lambda.CreateEventSourceMappingParams): Promise<any>;
    createFunction(params: AwsSdk.Lambda.CreateFunctionParams): Promise<any>;
    deleteAlias(params: AwsSdk.Lambda.DeleteAliasParams): Promise<any>;
    deleteEventSourceMapping(params: AwsSdk.Lambda.DeleteEventSourceMappingParams): Promise<any>;
    deleteFunction(params: AwsSdk.Lambda.DeleteFunctionParams): Promise<any>;
    getAlias(params: AwsSdk.Lambda.GetAliasParams): Promise<any>;
    getEventSourceMapping(params: AwsSdk.Lambda.GetEventSourceMappingParams): Promise<any>;
    getFunction(params: AwsSdk.Lambda.GetFunctionParams): Promise<any>;
    getFunctionConfiguration(params: AwsSdk.Lambda.GetFunctionConfigurationParams): Promise<any>;
    getPolicy(params: AwsSdk.Lambda.GetPolicyParams): Promise<any>;
    invoke(params: AwsSdk.Lambda.InvokeParams): Promise<any>;
    listAliases(params: AwsSdk.Lambda.ListAliasesParams): Promise<any>;
    listEventSourceMappings(params: AwsSdk.Lambda.ListEventSourceMappingsParams): Promise<any>;
    listFunctions(params: AwsSdk.Lambda.ListFunctionsParams): Promise<any>;
    listVersionsByFunction(params: AwsSdk.Lambda.ListVersionsByFunctionParams): Promise<any>;
    publishVersion(params: AwsSdk.Lambda.PublishVersionParams): Promise<any>;
    removePermission(params: AwsSdk.Lambda.RemovePermissionParams): Promise<any>;
    updateAlias(params: AwsSdk.Lambda.UpdateAliasParams): Promise<any>;
    updateEventSourceMapping(params: AwsSdk.Lambda.UpdateEventSourceMappingParams): Promise<any>;
    updateFunctionCode(params: AwsSdk.Lambda.UpdateFunctionCodeParams): Promise<any>;
    updateFunctionConfiguration(params: AwsSdk.Lambda.UpdateFunctionConfigurationParams): Promise<any>;
}

export interface PromisifiedIam {
    getRole(params: AwsSdk.IAM.GetRoleParams): Promise<any>;
    createRole(params: AwsSdk.IAM.CreateRoleParams): Promise<any>;
    putRolePolicy(params: AwsSdk.IAM.PutRolePolicyParams): Promise<any>;
}

export interface PromisifiedCloudWatchEvents {
    putRule(params: AwsSdk.CloudWatchEvents.PutRuleParams): Promise<any>;
    putTargets(params: AwsSdk.CloudWatchEvents.PutTargetsParams): Promise<any>;
    listRuleNamesByTarget(params: AwsSdk.CloudWatchEvents.ListRuleNamesByTargetParams): Promise<any>;
}

function boundPromisify<T>(input: {}): T {
    let output = {};
    for (let prop in input) {
        if (input[prop].bind) {
            output[prop] = promisify(input[prop].bind(input));
        } else {
            output[prop] = input[prop];
        }
    }
    return <T> output;
}

export var promisifyEvents = <(lambda: AwsSdk.CloudWatchEvents) => PromisifiedCloudWatchEvents> boundPromisify;
export var promisifyLambda = <(lambda: AwsSdk.Lambda) => PromisifiedLambda> boundPromisify;
export var promisifyIam = <(iam: AwsSdk.IAM) => PromisifiedIam> boundPromisify;
