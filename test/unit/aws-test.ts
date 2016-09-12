import sinon = require("sinon");

import expect from "../expect";

import Zip = require("jszip");
import AwsSdk = require("aws-sdk");
import { AwsDeployer, AwsRoleCreator } from "../../src/aws";

describe("Aws deployer", () => {
    let awsStub: any;
    let lambda: any;
    let bundle: any;

    let deployer: AwsDeployer;

    beforeEach(() => {
        lambda = {
            getFunction: sinon.stub(),
            createFunction: sinon.stub()
        };
        awsStub = { Lambda: sinon.stub().returns(lambda) };
        bundle = { generateAsync: sinon.stub() };

        deployer = new AwsDeployer(awsStub);
    });

    it("authenticates with the given credentials", async () => {
        deployer.deployLambdaBundle(bundle, <any> { }, {
            accessKeyId: "test-access-key",
            secretAccessKey: "test-secret-access-key"
        });

        expect(awsStub.Lambda).to.have.been.calledWithMatch({
            credentials: {
                accessKeyId: "test-access-key",
                secretAccessKey: "test-secret-access-key"
            }
        })
    });

    describe("when deploying a new bundle", () => {
        const bundleData = "my-bundle-data";

        beforeEach(() => {
            lambda.getFunction.yields({statusCode: 404});
            lambda.createFunction.yields();

            bundle.generateAsync.returns(
                Promise.resolve(Buffer.from(bundleData, "utf8"))
            );
        });

        it("creates a new function with the given parameters", async () => {
            await deployer.deployLambdaBundle(bundle, {
                functionName: "test-function",
                region: "eu-west-1",
                handler: "handler.handler"
            }, <any> {});

            expect(lambda.createFunction).to.have.been.calledOnce;
            expect(lambda.createFunction).to.have.been.calledWithMatch({
                FunctionName: "test-function",
                Handler: "handler.handler",
                Publish: true,
                Runtime: "nodejs4.3",
                Description: "DevBot: test-function"
            });
        });

        it("creates a new function with the given bundle", async () => {
            await deployer.deployLambdaBundle(bundle, <any> {}, <any> {});

            expect(lambda.createFunction).to.have.been.calledOnce;
            expect(lambda.createFunction).to.have.been.calledWithMatch({
                Code: {
                    ZipFile: Buffer.from(bundleData)
                }
            });
        });
    });
});

describe("AWS Role Creator", () => {
    let awsStub: any;
    let iam: any;

    let roleCreator: AwsRoleCreator;

    beforeEach(() => {
        iam = {
            createRole: sinon.stub(),
            getRole: sinon.stub()
        };
        awsStub = { IAM: sinon.stub().returns(iam) };

        roleCreator = new AwsRoleCreator(awsStub);
    });

    it("authenticates with the given credentials", async () => {
        roleCreator.createRole("my-role", {
            accessKeyId: "test-access-key",
            secretAccessKey: "test-secret-access-key"
        });

        expect(awsStub.IAM).to.have.been.calledWithMatch({
            credentials: {
                accessKeyId: "test-access-key",
                secretAccessKey: "test-secret-access-key"
            }
        })
    });

    describe("if the role does not exist", () => {
        beforeEach(() => {
            iam.getRole.yields({statusCode: 404});
            iam.createRole.yields(null, { });
        });

        it("creates a role with the given name", async () => {
            await roleCreator.createRole("role-name", <any> { });

            expect(iam.createRole).to.have.been.calledOnce;
            expect(iam.createRole).to.have.been.calledWithMatch({
                RoleName: "role-name"
            });
        });

        it("creates a role with a policy allowing just logging by default", async () => {
            await roleCreator.createRole("role-name", <any> { });

            let policy = JSON.parse(iam.createRole.args[0][0].AssumeRolePolicyDocument);
            expect(policy.Statement).to.deep.equal([
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]);
        });

        it("returns the resulting ARN", async () => {
            iam.createRole.yields(null, { Arn: "stub::arn/result" });

            let result = await roleCreator.createRole("role-name", <any> { });

            expect(result).to.equal("stub::arn/result");
        });
    });

    describe("if the role already exists", () => {
        beforeEach(() => {
            iam.getRole.yields(null, { Arn: "arn" });
        });

        it("returns the ARN", async () => {
            iam.getRole.yields(null, { Arn: "stub::arn/existing-result" });

            let result = await roleCreator.createRole("role-name", <any> { });

            expect(result).to.equal("stub::arn/existing-result");
        });

        it("does not create a new role", async () => {
            await roleCreator.createRole("role-name", <any> { });

            expect(iam.createRole).not.to.have.been.called;
        });
    });
});
