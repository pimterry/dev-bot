import sinon = require("sinon");
import AwsSdk = require("aws-sdk");

import expect from "../../expect";

import RoleCreator from "../../../src/aws/role-creator";

describe("Role Creator", () => {
    let awsStub: any;
    let iam: any;

    let roleCreator: RoleCreator;

    beforeEach(() => {
        iam = {
            createRole: sinon.stub(),
            getRole: sinon.stub(),
            putRolePolicy: sinon.stub()
        };
        awsStub = { IAM: sinon.stub().returns(iam) };

        roleCreator = new RoleCreator(awsStub);
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
            iam.putRolePolicy.yields(null, { });
        });

        it("creates a role with the given name", async () => {
            await roleCreator.createRole("role-name", <any> { });

            expect(iam.createRole).to.have.been.calledOnce;
            expect(iam.createRole).to.have.been.calledWithMatch({
                RoleName: "role-name"
            });
        });

        it("creates a role with a trust policy allowing lambda", async () => {
            await roleCreator.createRole("role-name", <any> { });

            let policy = JSON.parse(iam.createRole.args[0][0].AssumeRolePolicyDocument);
            expect(policy.Statement).to.deep.equal([
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]);
        });

        it("returns the resulting ARN", async () => {
            iam.createRole.yields(null, { Arn: "stub::arn/result" });

            let result = await roleCreator.createRole("role-name", <any> { });

            expect(result).to.equal("stub::arn/result");
        });

        it("includes an inline policy allowing basic logging for the role", async () => {
            await roleCreator.createRole("role-name", <any> { });

            let policy = JSON.parse(iam.putRolePolicy.args[0][0].PolicyDocument);
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
    });

    describe("if the role already exists", () => {
        beforeEach(() => {
            iam.getRole.yields(null, { Role: { Arn: "arn" } });
        });

        it("returns the ARN", async () => {
            iam.getRole.yields(null, { Role: { Arn: "stub::arn/existing-result" } });

            let result = await roleCreator.createRole("role-name", <any> { });

            expect(result).to.equal("stub::arn/existing-result");
        });

        it("does not create a new role", async () => {
            await roleCreator.createRole("role-name", <any> { });

            expect(iam.createRole).not.to.have.been.called;
        });
    });
});
