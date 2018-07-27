const path = require("path");

const FsPromise = require("./FsPromise");

class ConfigFileLoader {
	static async getAvailableFilePath(customConfigFilePath) {
		const filesToCheck = [
			"martelo.config.js",
			"martelo.config.json",
			"package.json",
		];

		let configFilePath = null;

		// Config file parameter is set, let's add it to the top of the file check list
		if (customConfigFilePath !== void 0) {
			filesToCheck.unshift(customConfigFilePath);
		}

		for (const filePath of filesToCheck) {
			const fileStat = await FsPromise.stat(filePath)
				.catch(() => null);

			// File exists or is a custom file that doesn't exist; break out of the loop
			if ((fileStat !== null) || (filePath === customConfigFilePath)) {
				configFilePath = filePath;

				break;
			}
		}

		return configFilePath;
	}

	static load(configFilePath) {
		let config = null;

		if (configFilePath !== null) {
			config = require(path.resolve(configFilePath));

			if (configFilePath === "package.json") {
				config = config.martelo;
			}
		}

		return config;
	}
}

exports = module.exports = ConfigFileLoader;
