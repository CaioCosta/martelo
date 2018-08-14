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
	.option("-b, --build", "Builds the project before watching for changes")
	.action(async (environment) => {
		const martelo = await createMarteloInstance(environment);

		await martelo.build();

		return martelo.watch();
	});

commander.parse(process.argv);
