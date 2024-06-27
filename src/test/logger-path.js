"use strict";

require("dotenv").config();

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

const path = require("path");
const Logger = require("../module/logger");
const DEFAULT_LOGGER_PATH = "./logger/";

describe("test logger path option", async function () {
  it("Should instantiate from specified path", async function () {
    const logger_path = path.join(__dirname, "../test-util/logger/");
    const options = {
      type: "test",
    };
    const logger = new Logger(logger_path, options);
    logger.logger.constructor.name.should.equal("LoggerTest");
  });

  it("Should instantiate from default path", async function () {
    const options = {
      type: "salesforce",
    };
    const logger = new Logger(DEFAULT_LOGGER_PATH, options);
    logger.logger.constructor.name.should.equal("LoggerSalesforce");
  });
});
