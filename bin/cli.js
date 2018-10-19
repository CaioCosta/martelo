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

commander
	.command("sync [environment]")
	.alias("s")
	.description(
		"Creates a Browsersync instance to refresh the browser with the changes in built files"
	)
	.option("-b, --build", "Builds the project before spanning the Browsersync instance")
	.option("-w, --watch", "Watches for changes in source files along with Browsersync instance")
	.action(async (environment, args) => {
		const martelo = await createMarteloInstance(environment);
		const browserSync = require("browser-sync").create();

		if (args.build) {
			await martelo.build();
		}

		if (args.watch) {
			martelo.watch(browserSync);
		}

		return martelo.sync(browserSync);
	});

commander.parse(process.argv);
