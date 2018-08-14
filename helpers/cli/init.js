const inquirer = require("inquirer");
const stringifyObject = require("stringify-object");

const ConfigFileLoader = require("../../lib/ConfigFileLoader");
const Logger = require("../../lib/Logger");

const inquiryPrefix = Logger.getMessageStart();

function validateNotEmpty(value) {
	return (value !== "");
}

async function loadConfig(customConfigFilePath) {
	return await ConfigFileLoader.load(
		await ConfigFileLoader.getAvailableFilePath(customConfigFilePath)
	);
}

function inquireBaseSourcePath(currentConfig) {
	return inquirer.prompt([{
		type: "input",
		name: "baseSourcePath",
		message: "Base source path:",
		default: currentConfig,
		prefix: inquiryPrefix,
	}]);
}

async function loopEnvironments(currentConfig) {
	const noCurrentEnvConfig = (currentConfig === void 0);

	currentConfig = currentConfig || {};

	const environmentKeys = Object.keys(currentConfig);

	let keepAdding = true;
	let i = 0;
	let environments = {};

	Logger.log("[[f:Environments]]");

	while (keepAdding) {
		const currentEnvKey = environmentKeys[i];
		const currentEnvConfig = currentConfig[currentEnvKey];

		const environmentAnswers = await inquireEnvironment(i, currentEnvKey, currentEnvConfig);
		const keepAddingAnswer = await inquirer.prompt([{
			type: "list",
			name: "confirm",
			choices: ["Yes", "No"],
			message: "Add another environment?",
			// If no environment was configured or there were more environments configured,
			// default is Yes
			default: ((noCurrentEnvConfig || (environmentKeys[i + 1] !== void 0)) ? "Yes" : "No"),
			prefix: inquiryPrefix,
		}]);

		const environmentKey = environmentAnswers.key;

		delete environmentAnswers.key;

		environments[environmentKey] = environmentAnswers;

		keepAdding = (keepAddingAnswer.confirm === "Yes");

		i++;
	}

	return environments;
}

function inquireEnvironment(index, currentEnvKey, currentEnvConfig) {
	currentEnvConfig = currentEnvConfig || {};

	Logger.log(`[[e:Environment #${(index + 1)}]]`);

	return inquirer.prompt([{
		type: "input",
		name: "key",
		message: `Key:`,
		validate: validateNotEmpty,
		default: currentEnvKey,
		prefix: inquiryPrefix,
	}, {
		type: "input",
		name: "path",
		message: `Path:`,
		validate: validateNotEmpty,
		default: currentEnvConfig.path,
		prefix: inquiryPrefix,
	}]);
}

async function loopBuilds(currentConfig, availableBuilders) {
	const noCurrentBuildConfig = (currentConfig === void 0);

	currentConfig = currentConfig || {};

	const buildKeys = Object.keys(currentConfig);

	let keepAdding = true;
	let builds = {};
	let i = 0;

	Logger.log("[[f:Builds]]");

	while (keepAdding) {
		const currentBuildKey = buildKeys[i];
		const currentBuildConfig = currentConfig[currentBuildKey];

		const buildAnswers = await inquireBuild(
			i,
			currentBuildKey,
			currentBuildConfig,
			availableBuilders
		);
		const keepAddingAnswer = await inquirer.prompt([{
			type: "list",
			name: "confirm",
			choices: ["Yes", "No"],
			message: "Add another build?",
			// If no build was configured or there were more builds configured,
			// default is Yes
			default: ((noCurrentBuildConfig || (buildKeys[(i + 1)] !== void 0)) ? "Yes" : "No"),
			prefix: inquiryPrefix,
		}]);

		builds[buildAnswers.key] = buildAnswers;

		delete buildAnswers.key;

		keepAdding = (keepAddingAnswer.confirm === "Yes");

		i++;
	}

	return builds;
}

async function inquireBuild(index, currentKey, currentConfig, availableBuilders) {
	currentConfig = currentConfig || {};

	Logger.log(`[[e:Build #${(index + 1)}]]`);

	const build = await inquirer.prompt([{
		type: "input",
		name: "key",
		message: "Key:",
		validate: validateNotEmpty,
		default: currentKey,
		prefix: inquiryPrefix,
	}, {
		type: "list",
		name: "type",
		choices: Object.keys(availableBuilders),
		message: "Type:",
		default: currentConfig.type,
		prefix: inquiryPrefix,
	}]);

	build.source = await loopPaths(
		"Source path (relative to base source path; leave blank to stop adding):",
		Array.isArray(currentConfig.source) ? currentConfig.source : [currentConfig.source]
	);

	build.destination = (await inquirer.prompt([{
		type: "input",
		name: "destination",
		message: "Destination path (relative to environment path):",
		validate: validateNotEmpty,
		default: currentConfig.destination,
		prefix: inquiryPrefix,
	}])).destination;

	const hasWatchConfig = ((currentConfig.watch !== void 0) && (currentConfig.watch.length > 0));

	const addWatchListAnswer = await inquirer.prompt([{
		type: "list",
		name: "confirm",
		choices: ["Yes", "No"],
		message: `Create a watch list for ${build.key}?`,
		default: (hasWatchConfig ? "Yes" : "No"),
		prefix: inquiryPrefix,
	}]);

	if (addWatchListAnswer.confirm === "Yes") {
		build.watch = await loopPaths(
			"Watch path (relative to base source path; leave blank to stop adding):",
			Array.isArray(currentConfig.watch) ? currentConfig.watch : [currentConfig.watch]
		);
	}

	return build;
}

async function loopPaths(questionMessage, defaultValues) {
	let keepAdding = true;
	let paths = [];
	let i = 0;

	while (keepAdding) {
		const question = await inquirer.prompt([{
			type: "input",
			name: "path",
			message: (questionMessage || "Path (leave blank to stop adding):"),
			default: defaultValues[i],
			prefix: inquiryPrefix,
		}]);

		if (question.path !== "") {
			paths.push(question.path);
		}
		else {
			keepAdding = false;
		}

		i++;
	}

	return paths;
}

async function init(customConfigFilePath) {
	Logger.setCurrentLogLevel(Logger.getCurrentLogLevel() + Logger.getLevelStep());

	const configFilePath = await ConfigFileLoader.getAvailableFilePath(customConfigFilePath);

	let currentConfig = {};
	let config = {};

	if (configFilePath === null) {
		Logger.log(`[[f:${customConfigFilePath}]] was not found`, "WARN");
	}
	else {
		currentConfig = ConfigFileLoader.load(configFilePath);
	}

	config.baseSourcePath = await inquireBaseSourcePath(currentConfig.baseSourcePath);
	config.environments = await loopEnvironments(currentConfig.environments);
	config.builds = await loopBuilds(currentConfig.builds, currentConfig.builderPaths);

	const pretty = stringifyObject(config, {
		indent: "\t",
		singleQuotes: false,
	});

	console.log(pretty);
}

exports = module.exports = init;
