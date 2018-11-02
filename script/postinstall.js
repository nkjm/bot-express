#!/usr/bin/env node

var fs = require("fs");
var readline = require("readline");
var os = require("os");
var skill_dir = "../../skill";
var index_script = "../../index.js";

if (!process.env.TRAVIS && process.env.NODE_ENV != "test" && process.env.NODE_ENV != "production"){

    fs.stat(skill_dir, function(err, stats){
        if (err && err.code == "ENOENT"){
            fs.stat(index_script, function(err, stats){
                if (err && err.code == "ENOENT"){
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question('May I create skill directory and index.js for you? (y/n): ', function(answer){
                        if (answer == "y"){
                            create_skill_dir(skill_dir);
                            create_indexjs(index_script);
                        }
                        rl.close();
                    });
                }
            });
        }
    });
}

function create_skill_dir(skill_dir){
    console.log("Creating skill directory for you...");
    fs.mkdirSync(skill_dir);
}

function create_indexjs(dest){
    console.log("Creating index.js for you...");
    var r = fs.createReadStream("./script/index.js");
    var w = fs.createWriteStream(dest);
    r.pipe(w);
}
