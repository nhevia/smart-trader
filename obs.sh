#!/bin/bash

javascript-obfuscator $PWD/public/routes --output $PWD/public/routes
javascript-obfuscator $PWD/public/preload.js --output $PWD/public/preload.js
javascript-obfuscator $PWD/public/app.js --output $PWD/public/app.js
javascript-obfuscator $PWD/public/electron.js --output $PWD/public/electron.js