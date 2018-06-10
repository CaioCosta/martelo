#!/usr/bin/env node

const path = require("path");

const args = require("../helpers/args");

const FsPromise = require("../lib/FsPromise");
const Logger = require("../lib/Logger");
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
				const message = `File [[f:${filePath}]] doesn't exist`;

				// Config file was forced, but not found. We'll exit now.
				if (filePath === args.config) {
					Logger.log(message, "FATAL");

					process.exit(1);
				}
				else {
					Logger.log(message, "INFO");
				}
			});

		// Config file is found; break out of the loop
		if (fileStat !== void 0) {
			configFilePath = filePath;

			Logger.log(`Using config from [[f:${filePath}]]`, "INFO");

			break;
		}
	}

	if (configFilePath !== null) {
		config = require(path.resolve(configFilePath));

		if (configFilePath === "package.json") {
			config = config.martelo;

			if (config === void 0) {
				Logger.log(`There's no config in [[f:package.json]]`, "ERROR");
			}
		}

		if (config !== void 0) {
			let options = {};

			if (args._[0]) {
				options.environment = args._[0];
			}

			if (args._[1]) {
				options.partial = args._[1];
			}

			const martelo = new Martelo(config, options);

			return martelo.build();
		}
	}

	if (!config) {
		Logger.log([
			"No configuration file has been found.",
			"Please refer to the guide at https://github.com/CaioCosta/martelo to know how to "
			+ "configure your project.",
		], "FATAL");

		process.exit(1);
	}
})();
