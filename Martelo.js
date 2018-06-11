const deepmerge = require("deepmerge");
const path = require("path");

const Environment = require("./lib/Environment");
const Logger = require("./lib/Logger");

const failTest = require("./helpers/failTest");

/**
 * Environment-based Static Assets Builder
 *
 * An instance of Martelo can build any number of environments, but it's always good to know you can
 * instantiate it as many times as you want.
 */
class Martelo {
	/**
	 * Stores the build config, run runOptions and Type Builders, then calls updateEnvironments()
	 *
	 * @param config
	 * @param runOptions
	 */
	constructor(config, runOptions) {
		Logger.log(`Init`, "MAIN");

		this.config = deepmerge.all([Martelo.defaultConfig, config]);
		this.environments = [];
		this.options = Object.assign({}, Martelo.defaultRunOptions, runOptions);

		failTest(
			this.config.environments,
			void 0,
			`There's no [[e:environment]] key in the build config.`
		);

		this.updateEnvironments();
	}


	/**
	 * Updates the environments to build based on the environment key in the run options
	 */
	updateEnvironments() {
		if (this.options.environment === "all") {
			for (const environmentKey in this.config.environments) {
				if (this.config.environments.hasOwnProperty(environmentKey)) {
					const environmentConfig = this.config.environments[environmentKey]
					const environment = new Environment(
						environmentKey,
						environmentConfig,
						this.config
					);

					this.environments.push(environment);
				}
			}
		}
		else if (this.config.environments[this.options.environment] !== void 0) {
			const environmentKey = this.options.environment;
			const environmentConfig = this.config.environments[environmentKey];
			const environment = new Environment(
				environmentKey,
				environmentConfig,
				this.config
			);

			this.environments.push(environment);
		}
		else {
			Logger.log(`Environment [[e:${this.options.environment}]] doesn't exist`, "ERROR");
		}
	}

	/**
	 * Calls each environment's build() method synchronously
	 *
	 * @returns {Promise<void>}
	 */
	async build() {
		Logger.log(`Selected environment: [[e:${this.options.environment}]]`, "MAIN");

		const startTime = Date.now();
		let success = true;

		for (const environment of this.environments) {
			await environment.runBuilders()
				.catch((error) => {
					success = false;

					Logger.log("There was an unhandled error in the build.", "FATAL");

					Logger.log(error, "DEBUG");
				});
		}

		Logger.timeEnd("Build", startTime, "MAIN", success);
	}

	async watch() {
		Logger.log("Watching for changes...");

		for (const environment of this.environments) {
			await environment.runWatchers();
		}
	}
}

Martelo.defaultConfig = {
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

Martelo.defaultRunOptions = {
	environment: "development",
	partial: false,
};

exports = module.exports = Martelo;
