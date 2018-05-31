const deepmerge = require("deepmerge");
const path = require("path");

const Environment = require("./lib/Environment/Environment");

const failTest = require("./helpers/failTest");
const log = require("./helpers/log");

class Martelo {
	constructor(config, runOptions) {
		log(`Init`, "MAIN");

		this.config = deepmerge.all([Martelo.defaultConfig, config]);
		this.environments = [];
		this.options = Object.assign({}, Martelo.defaultRunOptions, runOptions);

		failTest(
			this.config.environments,
			void 0,
			`There's no ${log.formatEnvironment("environment")} key in the build config.`
		);

		this.updateEnvironments();
	}

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
			log(`Environment ${this.options.environment} doesn't exist`, "ERROR");
		}
	}

	async build() {
		log(`Selected environment: ${log.formatEnvironment(this.options.environment)}`, "MAIN");

		const startTime = Date.now();
		let success = true;

		for (const environment of this.environments) {
			await environment.runBuilders()
				.catch((error) => {
					success = false;

					log("There was an unhandled error in the build.", "FATAL");

					log(error, "DEBUG");
				});
		}

		log.timeEnd("Build", startTime, "MAIN", success);
	}
}

Martelo.defaultConfig = {
	baseSourcePath: ".",
	updateRevisionedReferences: "\\.(css|js|html)$",
	builderPaths: {
		copy: __dirname + "/lib/Builder/GenericBuilder",
		images: __dirname + "/lib/Builder/ImagesBuilder",
		scripts: __dirname + "/lib/Builder/ScriptsBuilder",
		styles: __dirname + "/lib/Builder/StylesBuilder",
	},
};

Martelo.defaultRunOptions = {
	environment: "development",
	partial: false,
};

exports = module.exports = Martelo;
