/*
 * This file becomes part of every end-user's deployed app. We essentially wrap their code to handle
 * all the Lambda interfacing and interactions with the dev platforms, and then call through to the
 * listeners they've defined.
 */
import lambda = require("aws-lambda");
import { LambdaHandler } from "../aws/lambda-deployer";

let devBot = require("dev-bot");
let devBotConfig = require("./dev-bot-bundle-config.json");

Object.assign(process.env, devBotConfig.env);
let entryPoint = require(devBotConfig.entryPoint);

exports.handler = <LambdaHandler> function handler(
    event: {},
    context: lambda.Context,
    callback: (err, data) => void
) {
    devBot.runBot(entryPoint);
}
