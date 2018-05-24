#!/usr/bin/env node

const path = require("path");

const args = require("../helpers/args");
const log = require("../helpers/log");

const FsPromise = require("../lib/FsPromise/FsPromise");
const Martelo = require("../Martelo");

(async () => {
	"use strict";

	const filesToCheck = [
		"martelo.config.js",
		"martelo.config.json",
		"package.json",
	];

	let config = null;
	let configFilePath = null;

	// Config file parameter is set, let's add it to the top of the file check list
	if (args.config !== null) {
		filesToCheck.unshift(args.config);
	}

	for (const filePath of filesToCheck) {
		const fileStat = await FsPromise.stat(filePath)
			.catch(() => {
				const message = `File ${log.formatFilename(filePath)} doesn't exist`;

				// Config file was forced, but not found. We'll exit now.
				if (filePath === args.config) {
					log(message, "FATAL");

					process.exit(1);
				}
				else {
					log(message, "INFO");
				}
			});

		// Config file is found; break out of the loop
		if (fileStat !== void 0) {
			configFilePath = filePath;

			log(`Using config from ${log.formatFilename(filePath)}`, "INFO");

			break;
		}
	}

	if (configFilePath !== null) {
		config = require(path.resolve(configFilePath));

		if (configFilePath === "package.json") {
			config = config.martelo;

			if (config === void 0) {
				log(`There's no config in ${log.formatFilename("package.json")}`, "ERROR");
			}
		}

		if (config !== void 0) {
			const martelo = new Martelo(config, {
				environment: args._[0],
				partial: args._[1],
			});

			return martelo.build();
		}
	}

	if (!config) {
		log(
			"No configuration file has been found.\n"
			+ "Please refer to the guide at https://github.com/CaioCosta/martelo to know how to "
			+ "configure your project.",
			"FATAL"
		);
	}
})();
