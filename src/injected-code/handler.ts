/*
 * This file becomes part of every end-user's deployed app. We essentially wrap their code to handle
 * all the Lambda interfacing and interactions with the dev platforms, and then call through to the
 * listeners they've defined.
 */
import { LambdaHandler } from "../aws";

export interface DevBotEntryPoint {
    // TODO: Insert all our entry point methods here, and their interfaces
}

let devBotConfig = require("./dev-bot-bundle-config.json");
let entryPoint = <DevBotEntryPoint> require(devBotConfig.entryPoint);

console.log("DevBot handler running!");

module.exports = <LambdaHandler> entryPoint;
