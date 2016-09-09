import path = require("path");
import temp = require("temp");
temp.track();

import expect from "../expect";

import { sleep, createDevBot, extractToDisk } from "../test-helpers";

import { LambdaHandler } from "../../src/aws";
import { buildBundle, BundleSpec } from "../../src/bundle";

export async function buildHandler(bundleSpec: BundleSpec): Promise<LambdaHandler> {
    let bundle = await buildBundle(bundleSpec);

    let unbundleFolder = temp.mkdirSync("dev-bot-bundle");
    await extractToDisk(unbundleFolder, bundle);

    let handlerPath = path.join(unbundleFolder, "handler.js");

    await sleep(10);
    return require(handlerPath);
}

it("can build a deployable zip", async () => {
    let testBot = createDevBot("exports.isTestBot = true");

    let handler = await buildHandler(testBot);

    expect(handler).not.to.equal(null);
});

afterEach(function () {
    if (this.currentTest.state === 'failed') {
        temp.track(false);
    }
});
