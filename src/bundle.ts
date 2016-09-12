import fs = require("fs-extra");
import promisify = require("es6-promisify");
import path = require("path");
import Zip = require("jszip");

let readFile = promisify<string, string, string>(fs.readFile);

const HANDLER_PATH = path.join(__dirname, "handler.js");

export interface BundleSpec {
    rootDirectory: string;
    entryPoint: string;
    env: { [id: string]: string };
}

async function includeFolder(folderPath: string, bundle: Zip): Promise<void> {
    var folderWalk = fs.walk(folderPath);

    let walkFinished = new Promise((resolve) => {
        folderWalk.on('end', resolve);
    });

    let fileReads = [];
    folderWalk.on('data', function (file) {
        let relPath = path.relative(folderPath, file.path);

        if (!file.stats.isDirectory()) {
            // Promise waits (in parallel) for walk to be done and all files en route to be read.
            fileReads.push(readFile(file.path, "utf8").then((data) => bundle.file(relPath, data)));
        }
    });

    await walkFinished;
    await Promise.all(fileReads);
}

export async function buildBundle(bundleSpec: BundleSpec): Promise<Zip> {
    let bundle = new Zip();

    await includeFolder(bundleSpec.rootDirectory, bundle);
    await includeFolder(path.join(__dirname, "injected-code"), bundle);

    bundle.file("dev-bot-bundle-config.json", JSON.stringify({
        entryPoint: bundleSpec.entryPoint,
        env: bundleSpec.env
    }));

    return bundle;
}
