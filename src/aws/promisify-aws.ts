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
    addPermission(params: AwsSdk.Lambda.AddPermissionParams): Promise<void>;
    createAlias(params: AwsSdk.Lambda.CreateAliasParams): Promise<void>;
    createEventSourceMapping(params: AwsSdk.Lambda.CreateEventSourceMappingParams): Promise<void>;
    createFunction(params: AwsSdk.Lambda.CreateFunctionParams): Promise<void>;
    deleteAlias(params: AwsSdk.Lambda.DeleteAliasParams): Promise<void>;
    deleteEventSourceMapping(params: AwsSdk.Lambda.DeleteEventSourceMappingParams): Promise<void>;
    deleteFunction(params: AwsSdk.Lambda.DeleteFunctionParams): Promise<void>;
    getAlias(params: AwsSdk.Lambda.GetAliasParams): Promise<void>;
    getEventSourceMapping(params: AwsSdk.Lambda.GetEventSourceMappingParams): Promise<void>;
    getFunction(params: AwsSdk.Lambda.GetFunctionParams): Promise<void>;
    getFunctionConfiguration(params: AwsSdk.Lambda.GetFunctionConfigurationParams): Promise<void>;
    getPolicy(params: AwsSdk.Lambda.GetPolicyParams): Promise<void>;
    invoke(params: AwsSdk.Lambda.InvokeParams): Promise<void>;
    listAliases(params: AwsSdk.Lambda.ListAliasesParams): Promise<void>;
    listEventSourceMappings(params: AwsSdk.Lambda.ListEventSourceMappingsParams): Promise<void>;
    listFunctions(params: AwsSdk.Lambda.ListFunctionsParams): Promise<void>;
    listVersionsByFunction(params: AwsSdk.Lambda.ListVersionsByFunctionParams): Promise<void>;
    publishVersion(params: AwsSdk.Lambda.PublishVersionParams): Promise<void>;
    removePermission(params: AwsSdk.Lambda.RemovePermissionParams): Promise<void>;
    updateAlias(params: AwsSdk.Lambda.UpdateAliasParams): Promise<void>;
    updateEventSourceMapping(params: AwsSdk.Lambda.UpdateEventSourceMappingParams): Promise<void>;
    updateFunctionCode(params: AwsSdk.Lambda.UpdateFunctionCodeParams): Promise<void>;
    updateFunctionConfiguration(params: AwsSdk.Lambda.UpdateFunctionConfigurationParams): Promise<void>;
}

export interface PromisifiedIam {
    getRole(params: AwsSdk.IAM.GetRoleParams): Promise<any>;
    createRole(params: AwsSdk.IAM.CreateRoleParams): Promise<any>;
    putRolePolicy(params: AwsSdk.IAM.PutRolePolicyParams): Promise<any>;
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

export var promisifyLambda = <(lambda: AwsSdk.Lambda) => PromisifiedLambda> boundPromisify;
export var promisifyIam = <(iam: AwsSdk.IAM) => PromisifiedIam> boundPromisify;
