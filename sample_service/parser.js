"use strict";

const debug = require("debug")("bot-express:service");
const dialogflow = require("dialogflow");
const sessions_client = new dialogflow.SessionsClient({
    project_id: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
})
const session_path = sessions_client.sessionPath(process.env.GOOGLE_PROJECT_ID, process.env.GOOGLE_PROJECT_ID);
const language = "ja";
const structjson = require("./structjson");

module.exports = class ServiceParser {
    static extract(param_key, value){
        if (typeof value != "string") return Promise.resolve(null);
        if (!value) return Promise.resolve(null);

        return sessions_client.detectIntent({
            session: session_path,
            queryInput: {
                text: {
                    text: value,
                    languageCode: language
                }
            }
        }).then(responses => {
            const parameters = structjson.jsonToStructProto(
                structjson.structProtoToJson(responses[0].queryResult.parameters)
            );

            if (parameters.fields[param_key] && parameters.fields[param_key][parameters.fields[param_key].kind]){
                return parameters.fields[param_key][parameters.fields[param_key].kind];
            }
            return null;
        })
    }

    static parse(param_key, value, resolve, reject){
        if (typeof value != "string") return reject();
        if (!value) return reject();

        return sessions_client.detectIntent({
            session: session_path,
            queryInput: {
                text: {
                    text: value,
                    languageCode: language
                }
            }
        }).then(responses => {
            const parameters = structjson.jsonToStructProto(
                structjson.structProtoToJson(responses[0].queryResult.parameters)
            );

            if (parameters.fields[param_key] && parameters.fields[param_key][parameters.fields[param_key].kind]){
                return resolve(parameters.fields[param_key][parameters.fields[param_key].kind]);
            }
            return reject();
        })
    }
}
