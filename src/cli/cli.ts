#!/usr/bin/env node
import { runCommand } from "./arg-dispatcher";
import { parseArgs } from "./arg-parsing"

try {
    var args = parseArgs(process.argv);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}

runCommand(args).then(() => {
    console.log("Done.");
}).catch((error) => {
    console.error("----------------------");
    console.error("DevBot command failed!");
    console.error("----------------------");
    console.error(error);
});
