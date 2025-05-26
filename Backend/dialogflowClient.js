require('dotenv').config();
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.GOOGLE_APLICATION_CREDENTIALS,
});

async function sendMessageToDialogflow (message, sessionId = uuid.v4()){
    const sessionPath = sessionClient.projectAgentSessionPath(
        process.env.PROJECT_ID,
        sessionId
    );

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: 'es',
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    return responses[0].queryResult.fulfillmentText;

}

module.exports = {sendMessageToDialogflow};