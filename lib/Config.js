const deepmerge = require("deepmerge");
const path = require("path");

const FsPromise = require("./FsPromise");
const Logger = require("./Logger");

class Config {
	static async getAvailableConfigFilePath(customConfigFilePath) {
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
				.catch(() => {
					const message = `File [[f:${filePath}]] doesn't exist`;

					// Config file was forced, but not found. We'll exit now.
					if (filePath === customConfigFilePath) {
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

		return configFilePath;
	}

	static load(configFilePath) {
		let config = null;

		if (configFilePath !== null) {
			config = require(path.resolve(configFilePath));

			if (configFilePath === "package.json") {
				config = config.martelo;

				if (config === void 0) {
					Logger.log(`There's no config in [[f:package.json]]`, "ERROR");
				}
			}
		}

		return deepmerge.all([Config.defaults, config]);
	}
}

Config.defaults = {
	baseSourcePath: ".",
	updateRevisionedReferences: "\\.(css|js|html)$",
	builderPaths: {
		copy: __dirname + "/lib/Builders/GenericBuilder",
		images: __dirname + "/lib/Builders/ImagesBuilder",
		js: __dirname + "/lib/Builders/JsBuilder",
		css: __dirname + "/lib/Builders/CssBuilder",
		sass: __dirname + "/lib/Builders/SassBuilder",
	},
};

exports = module.exports = Config;
