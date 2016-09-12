import promisify = require("es6-promisify");
import fs = require("fs-extra");
import path = require("path");
import Zip = require("jszip");
import temp = require("temp");
temp.track();

import { BundleSpec } from "../src/bundle";

let outputFile = promisify<void, string, Buffer>(fs.outputFile);

export var sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

export function createDevBot(entryPointCode: string): BundleSpec {
    let botFolder = temp.mkdirSync("dev-bot-code");
    let entryPoint = path.join(botFolder, "bot-entrypoint.js");
    fs.writeFileSync(entryPoint, entryPointCode);
    return {
        rootDirectory: botFolder,
        entryPoint,
        env: {}
    };
}

export async function extractToDisk(outputPath: string, zip: Zip): Promise<void> {
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
