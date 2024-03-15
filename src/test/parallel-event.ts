"use strict";

require("dotenv").config();

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import Emulator from "../test-util/emulator";
const messenger_option = {
  name: "line",
  options: {
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
  },
};
import Promise from "bluebird";
import { ContextsClient } from "@google-cloud/dialogflow";
chai.use(chaiAsPromised);
const should = chai.should();

let emu = new Emulator(messenger_option.name, messenger_option.options, 'line_user_id');

describe("Test parallel event from " + emu.messenger_type, function () {
  let user_id = "parallel-event";

  describe("1 events", function () {
    it("should be processed.", function () {
      this.timeout(8000);

      return emu
        .clear_context(user_id)
        .then(function () {
          let event = emu.create_postback_event(user_id, {
            data: JSON.stringify({
              _type: "intent",
              intent: {
                name: "test-parallel-event",
              },
              language: "ja",
            }),
          });
          return emu.send(event);
        })
        .then(function (context: any) {
          context.intent.name.should.equal("test-parallel-event");
          context.previous.message[0].message.text.should.equal("done");
        });
    });
  });

  describe("2 parallel events", function () {
    it("should ignore second event.", function () {
      this.timeout(8000);

      return emu
        .clear_context(user_id)
        .then(function () {
          let event = emu.create_postback_event(user_id, {
            data: JSON.stringify({
              _type: "intent",
              intent: {
                name: "test-parallel-event",
              },
              language: "ja",
            }),
          });
          return Promise.all([
            emu.send(event),
            Promise.resolve()
              .delay(1000)
              .then(() => {
                return emu.send(event);
              }),
          ]);
        })
        .then(function (context_list) {
          let num_of_ignored = 0;

          for (let context of context_list) {
            if (!context) {
              num_of_ignored++;
            }
          }
          num_of_ignored.should.equal(1);
        });
    });
  });

  describe("2 parallel events and 1 is bot-express:push", function () {
    it("should process all events.", function () {
      this.timeout(8000);

      return emu
        .clear_context(user_id)
        .then(function () {
          let event = emu.create_postback_event(user_id, {
            data: JSON.stringify({
              _type: "intent",
              intent: {
                name: "test-parallel-event",
              },
              language: "ja",
            }),
          });
          return Promise.all([
            emu.send(event),
            Promise.resolve()
              .delay(1000)
              .then(() => {
                let event = {
                  type: "bot-express:push",
                  to: {
                    type: "user",
                    userId: user_id,
                  },
                  intent: {
                    name: "test-parallel-event",
                  },
                  language: "ja",
                };
                return emu.send(event);
              }),
          ]);
        })
        .then(function (context_list) {
          let num_of_ignored = 0;

          for (let context of context_list) {
            if (!context) {
              num_of_ignored++;
            }
          }
          num_of_ignored.should.equal(0);
        });
    });
  });

  describe("3 parallel events", function () {
    it("should ignored second and third event.", function () {
      this.timeout(8000);

      return emu
        .clear_context(user_id)
        .then(function () {
          let event = emu.create_postback_event(user_id, {
            data: JSON.stringify({
              _type: "intent",
              intent: {
                name: "test-parallel-event",
              },
              language: "ja",
            }),
          });
          return Promise.all([
            emu.send(event),
            Promise.resolve()
              .delay(1000)
              .then(() => {
                return emu.send(event);
              }),
            Promise.resolve()
              .delay(2000)
              .then(() => {
                return emu.send(event);
              }),
          ]);
        })
        .then(function (context_list) {
          let num_of_ignored = 0;
          for (let context of context_list) {
            if (!context) {
              num_of_ignored++;
            }
          }
          num_of_ignored.should.equal(2);
        });
    });
  });

  describe.only("multiple parallel events", function () {
    it("should ignore postback and message event if no delay", function () {
      this.timeout(8000);

      return emu
        .clear_context(user_id)
        .then(function () {
          const messageEvent = emu.create_message_event(user_id, "test-parallel-event 1");
          const messageEvent2 = emu.create_message_event(user_id, "test-parallel-event 2");
          const botExpressPushEvent = {
            type: "bot-express:push",
            to: {
              type: "user",
              userId: user_id,
            },
            intent: {
              name: "test-parallel-event",
            },
            language: "ja",
          };
          return Promise.all([
            emu.send(messageEvent),
            emu.send(botExpressPushEvent),
            emu.send(messageEvent2),
          ]);
        })
        .then(function (context_list) {
          const returnedContexts = context_list.filter((context) => {
            return context != null
          })
          returnedContexts.length.should.equal(2);
        });
    });
  });
});
