#!/usr/bin/env node

const path = require("path");

const args = require("../helpers/args");
const log = require("../helpers/log");

const FsPromise = require("../lib/FsPromise/FsPromise");
const Martelo = require("../Martelo");

(async () => {
	"use strict";

	let config = {};
	let configFilePath = null;

	if (args.config !== null) {
		const configFileStat = await FsPromise.stat(args.config)
			.catch(() => {
				log(`File ${log.formatFilename(args.config)} doesn't exist`, log.level.FATAL);
			});

		if (configFileStat === void 0) {
			return;
		}

		configFilePath = path.resolve(args.config);
	}

	if (configFilePath === null) {
		configFilePath = "martelo.config";
	}

	config = require(configFilePath);

	const martelo = new Martelo(config, {
		environment: args._[0],
		partial: args._[1],
	});

	return martelo.build();
})();
