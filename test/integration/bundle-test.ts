import promisify = require("es6-promisify");
import fs = require("fs-extra");
import path = require("path");
import Zip = require("jszip");
import temp = require("temp");
temp.track();

import chai = require("chai");

let expect = chai.expect;
let outputFile = promisify<void, string, Buffer>(fs.outputFile);

import { LambdaHandler } from "../../src/aws";
import { buildBundle, BundleSpec } from "../../src/bundle";

function createDevBotFolder(entryPointCode: string): BundleSpec {
    let botFolder = temp.mkdirSync("dev-bot-code");
    let entryPoint = path.join(botFolder, "bot-entrypoint.js");
    fs.writeFileSync(entryPoint, entryPointCode);
    return {
        rootDirectory: botFolder,
        entryPoint
    };
}

async function extractToDisk(outputPath: string, zip: Zip): Promise<void> {
    let fileWrites = [];

    zip.forEach((relativePath, file) => {
        if (!file.dir) {
            let write = file.async("nodebuffer").then(
                (contents: Buffer) => {
                    var filePath = path.join(outputPath, file.name);
                    outputFile(filePath, contents);
                }
            );
            fileWrites.push(write);
        }
    });

    await Promise.all(fileWrites);
}

let sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

async function buildHandler(bundleSpec: BundleSpec): Promise<LambdaHandler> {
    let bundle = await buildBundle(bundleSpec);

    let unbundleFolder = temp.mkdirSync("dev-bot-bundle");
    await extractToDisk(unbundleFolder, bundle);

    let handlerPath = path.join(unbundleFolder, "handler.js");

    await sleep(10);
    return require(handlerPath);
}

it("can build a deployable zip", async () => {
    let testBot = createDevBotFolder(`
        exports.isTestBot = true;
    `);

    let handler: any = await buildHandler(testBot);

    expect(handler.isTestBot).to.equal(true);
});

afterEach(function () {
    if (this.currentTest.state === 'failed') {
        temp.track(false);
    }
});
