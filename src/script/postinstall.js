#!/usr/bin/env node

var fs = require("fs");
var readline = require("readline");
var os = require("os");
var skill_dir = "../../skill";
var translation_dir = "../../translation";
var message_dir = "../../message";
var label_script = "../../translation/label.js";
var index_script = "../../index.js";
var sample_message = "../../message/sample_message.js";

if (!process.env.TRAVIS && process.env.NODE_ENV != "test" && process.env.NODE_ENV != "production"){

    fs.stat(skill_dir, function(err, stats){
        if (err && err.code == "ENOENT"){
            fs.stat(index_script, function(err, stats){
                if (err && err.code == "ENOENT"){
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question('May I create skill directory and translation/label.js and index.js for you? (y/n): ', function(answer){
                        if (answer == "y"){
                            create_dir(skill_dir);
                            create_dir(translation_dir);
                            create_dir(message_dir);
                            create_label_script(label_script);
                            create_indexjs(index_script);
                            create_sample_message(sample_message);
                        }
                        rl.close();
                    });
                }
            });
        }
    });
}

function create_dir(dir){
    console.log("Creating " + dir + " directory for you...");
    fs.mkdirSync(dir);
}

function create_label_script(dest){
    console.log("Creating translation/label.js for you...");
    var r = fs.createReadStream("./script/label.js");
    var w = fs.createWriteStream(dest);
    r.pipe(w);
}

function create_indexjs(dest){
    console.log("Creating index.js for you...");
    var r = fs.createReadStream("./script/index.js");
    var w = fs.createWriteStream(dest);
    r.pipe(w);
}

function create_sample_message(dest){
    console.log("Creating sample message for you...");
    var r = fs.createReadStream("./script/sample_message.js");
    var w = fs.createWriteStream(dest);
    r.pipe(w);
}
