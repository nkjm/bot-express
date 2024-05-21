"use strict";

require("dotenv").config();

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

const path = require("path");
const Logger = require("../module/logger");

describe("test line", async function () {
  it("Should instantiate from specified path", async function () {
    const logger_path = path.join(__dirname, "../test-util/logger/");
    const options = {
      type: "test",
    };
    const logger = new Logger(logger_path, options);
    logger.logger.name.should.equal("test-logger");
  });
});
