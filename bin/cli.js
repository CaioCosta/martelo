#!/usr/bin/env node

const commander = require("commander");
const pkg = require("../package");

const loadConfig = require("../helpers/loadConfig");

async function createMarteloInstance(environment) {
	const Martelo = require("../Martelo");

	const options = {};
	const config = await loadConfig(commander.config);

	if (environment != null) {
		options.environment = environment;
	}

	return new Martelo(config);
}

commander
	.version(pkg.version, "-v, --version")
	.description(pkg.description)
	.option("-c, --config <file>", "Path to custom config file");

commander
	.command("build [environment]")
	.alias("b")
	.description("Builds the selected environment")
	.action(async (environment) => {
		const martelo = await createMarteloInstance(environment);

		return martelo.build();
	});

commander
	.command("watch [environment]")
	.alias("w")
	.description("Watches for changes in the selected environment and run builders on each change")
	.action(async (environment) => {
		const martelo = await createMarteloInstance(environment);

		return martelo.watch();
	});

commander
	.command("init")
	.alias("i")
	.description("Inits the configuration and writes to martelo.config.js")
	.action(() => {
		require("../helpers/cli/init")(commander.config);
	});

commander.parse(process.argv);
