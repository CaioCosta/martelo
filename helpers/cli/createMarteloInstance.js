const Logger = require("../../lib/Logger");
const Martelo = require("../../Martelo");
const ConfigFileLoader = require("../../lib/ConfigFileLoader");

const failTest = require("../../helpers/failTest");

async function createMarteloInstance(environment, customConfigPath) {
	const options = {};
	const configFilePath = await ConfigFileLoader.getAvailableFilePath(customConfigPath);

	failTest(configFilePath, null, [
		"No configuration file has been found.",
		"Please refer to the guide at https://github.com/CaioCosta/martelo to know how to "
		+ "configure your project.",
	]);

	Logger.log(`Using config from [[f:${configFilePath}]]`, "INFO");

	failTest(
		((customConfigPath !== void 0) && (configFilePath === null)),
		true,
		`File [[f:${configFilePath}]] doesn't exist`,
	);

	let config = await ConfigFileLoader.load(configFilePath);

	failTest(config, null, [
		"The configuration could not be loaded.",
		"Please refer to the guide at https://github.com/CaioCosta/martelo to know how to "
		+ "configure your project.",
	]);

	if (configFilePath === "package.json") {
		config = config.martelo;

		if (config === void 0) {
			config = null;

			Logger.log(`There's no config in [[f:package.json]]`, "WARN");
		}
	}

	if (environment != null) {
		options.environment = environment;
	}

	return new Martelo(config, options);
}

exports = module.exports = createMarteloInstance;
