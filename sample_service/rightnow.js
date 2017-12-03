'use strict';

const soap = require("soap");
const memory = require("memory-cache");
const request = require('request');
const debug = require("debug")("bot-express:service");
Promise = require("bluebird");

const RN_USER = process.env.RN_USER;
const RN_PASSWORD = process.env.RN_PASSWORD;
const RN_HOSTNAME = process.env.RN_HOSTNAME;
const RN_WSDL = process.env.RN_WSDL;
const SOAP_WSS_SECURITY = new soap.WSSecurity(RN_USER, RN_PASSWORD, {hasTimeStamp: false, hasTokenCreated: false});
const APP_API_ID = 'kobaton';
const APP_IP_ADDRESS = '10.0.0.0';

Promise.promisifyAll(soap);
Promise.promisifyAll(request);

module.exports = class RightNow {

    static bot_rate_answer(interaction_id, content_id, rate, scale){
        debug("bot_rate_answer() started.");

        return RightNow.get_client().then(
            // Rate the content.
            (client) => {
                return RightNow.rate_content(client, interaction_id, content_id, rate, scale);
            }
        );
    }

    // Should be moved to another service.
    static bot_search_answer(question, product = null, category = null){
        debug("bot_search_answer() started.");

        let client;
        let interaction_id;

        return RightNow.get_client().then(
            // Start Interaction
            (response) => {
                client = response;
                return RightNow.start_interaction(client, APP_API_ID, APP_IP_ADDRESS);
            }
        ).then(
            // Search Contents using GetSmartAssistantSearch.
            (interaction) => {
                interaction_id = interaction.SessionToken;
                return RightNow.get_smart_assistnat_search(client, interaction_id, question, product, category);
            }
        ).then(
            // Get Full Content.
            (response) => {
                if (response.ContentListResponse.SummaryContents && response.ContentListResponse.SummaryContents.SummaryContentList){
                    debug("Got contents.");

                    let content_id;
                    if(response.ContentListResponse.SummaryContents.SummaryContentList.length > 0){
                        content_id = response.ContentListResponse.SummaryContents.SummaryContentList[0].ID.attributes.id;
                    } else {
                        content_id = response.ContentListResponse.SummaryContents.SummaryContentList.ID.attributes.id;
                    }
                    return RightNow.get_content(client, interaction_id, content_id);
                } else {
                    debug("No Hit");
                    return null;
                }
            }
        ).then(
            // Return Content
            (response) => {
                let result;
                if (response == null){
                    result = null;
                } else {
                    debug("Got full content.");
                    result = response.Content;
                }
                return {
                    interaction_id: interaction_id,
                    result: result
                };
            }
        );
    }

    static create_answer(answer){
        debug("create_answer() started.");
        let url = "https://" + process.env.RN_USER + ":" + process.env.RN_PASSWORD + "@" + process.env.RN_HOSTNAME + "/services/rest/connect/v1.3/answers";
        let headers = {
            "Content-Type": "application/json"
        };
        return request.postAsync({
            url: url,
            headers: headers,
            body: answer,
            json: true
        });
    }

    static rate_content(client, interaction_id, content_id, rate, scale){
        debug("rate_content() started.");

        let msg = {
            "$xml": `
            <SessionToken>${interaction_id}</SessionToken>
            <Content xmlns:q1="urn:knowledge.ws.rightnow.com/v1" xsi:type="q1:AnswerContent">
                <ID xmlns="urn:base.ws.rightnow.com/v1" id="${content_id}"/>
                <q1:Categories xsi:nil="true"/>
                <q1:CommonAttachments xsi:nil="true"/>
                <q1:FileAttachments xsi:nil="true"/>
                <q1:Keywords xsi:nil="true"/>
                <q1:Products xsi:nil="true"/>
                <q1:Question xsi:nil="true"/>
                <q1:Solution xsi:nil="true"/>
                <q1:ValidNullFields xsi:nil="true"/>
            </Content>
            <Rate>
                <ID xmlns="urn:base.ws.rightnow.com/v1" id="${rate}"/>
            </Rate>
            <Scale>
                <ID xmlns="urn:base.ws.rightnow.com/v1" id="${scale}"/>
            </Scale>`
        }
        return client.RateContentAsync(msg);
    }

    static get_content(client, interaction_id, content_id){
        debug("get_content() started.");

        let content_msg = {
            "$xml": `
                <SessionToken>${interaction_id}</SessionToken>
                <ContentTemplate xmlns:q1="urn:knowledge.ws.rightnow.com/v1" xsi:type="q1:AnswerContent">
                    <ID xmlns="urn:base.ws.rightnow.com/v1" id="${content_id}"/>
                    <q1:Categories xsi:nil="true"/>
                    <q1:CommonAttachments xsi:nil="true"/>
                    <q1:FileAttachments xsi:nil="true"/>
                    <q1:Keywords xsi:nil="true"/>
                    <q1:Products xsi:nil="true"/>
                    <q1:Question xsi:nil="true"/>
                    <q1:Solution xsi:nil="true"/>
                    <q1:ValidNullFields xsi:nil="true"/>
                </ContentTemplate>`
        }
        return client.GetContentAsync(content_msg);
    }

    static get_smart_assistnat_search(client, interaction_id, question, product, category){
        debug("get_smart_assistant_search() started.");

        let smart_assistant_search_msg = {
            SessionToken: interaction_id,
            Body: question,
            Subject: "bot-express" // This is supposed not to match any content to improve accuracy of SA result.
        }
        // If user specify product or category, we set corresponding filter.
        if (product || category){
            smart_assistant_search_msg.ContentSearch = {
                "$xml":""
            };
        }
        if (product){
            smart_assistant_search_msg.ContentSearch["$xml"] = `
                <Filters xmlns="urn:knowledge.ws.rightnow.com/v1">
                    <ContentFilterList xsi:type="ServiceProductContentFilter">
                        <ServiceProduct>
                            <Name xmlns="urn:base.ws.rightnow.com/v1">${product}</Name>
                        </ServiceProduct>
                    </ContentFilterList>
                </Filters>`;
        }
        if (category){
            smart_assistant_search_msg.ContentSearch["$xml"] += `
                <Filters xmlns="urn:knowledge.ws.rightnow.com/v1">
                    <ContentFilterList xsi:type="ServiceCategoryContentFilter">
                        <ServiceCategory>
                            <Name xmlns="urn:base.ws.rightnow.com/v1">${category}</Name>
                        </ServiceCategory>
                    </ContentFilterList>
                </Filters>`;
        }
        smart_assistant_search_msg.Limit = 1;

        return client.GetSmartAssistantSearchAsync(smart_assistant_search_msg);
    }

    static start_interaction(client, app_api_id, app_ip_addr){
        debug("start_interaction() started.");
        return client.StartInteractionAsync({
            AppIdentifier: app_api_id,
            UserIPAddress: app_ip_addr
        });
    }

    static get_client(){
        debug("get_client() started.");

        let client = memory.get("rn_soap_client");
        let client_created;
        if (client){
            debug("Rightnow soap client found.");
            return Promise.resolve(client);
        } else {
            debug("Rightnow soap client NOT found.");
            return RightNow.create_client(RN_WSDL, SOAP_WSS_SECURITY, APP_API_ID).then(
                (client) => {
                    Promise.promisifyAll(client);
                    memory.put("rn_soap_client", client);
                    return client;
                }
            )
        }
    }

    static create_client(wsdl, wss_security, app_id){
        debug("create_client() started.");

        return soap.createClientAsync(wsdl).then(
            (client) => {
                debug("Rightnow soap client created.");
                client.setSecurity(wss_security);
                client.addSoapHeader(
                    {
                        ClientInfoHeader: {
                            AppID : app_id
                        }
                    },         //soapHeader Object({rootName: {name: "value"}}) or strict xml-string
                    '',         //name Unknown parameter (it could just a empty string)
                    'rnm_v1',   //namespace prefix of xml namespace
                    ''          //xmlns URI
                );
                return client;
            }
        )
    }

}
