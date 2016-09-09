import sinon = require("sinon");

import expect from "../expect";

import Zip = require("jszip");
import AwsSdk = require("aws-sdk");
import { AwsDeployer } from "../../src/aws";

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

            expect(lambda.createFunction).to.have.been.calledWithMatch({
                Code: {
                    ZipFile: Buffer.from(bundleData)
                }
            });
        });
    });
});
