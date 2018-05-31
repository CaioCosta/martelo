const Environment = require("./lib/Environment/Environment");

const log = require("./helpers/log");

class Martelo {
	constructor(config, runOptions) {
		log(`Init`, "MAIN");

		this.buildConfig = Object.assign({}, Martelo.defaultBuildConfig, buildConfig);
		this.environments = [];
		this.typeBuilders = Object.assign(
			{},
			Martelo.defaultTypeBuilders,
			this.buildConfig.typeBuilders
		this.options = Object.assign({}, Martelo.defaultRunOptions, runOptions);
		);

		this.updateEnvironments();
	}

	updateEnvironments() {
		if (this.options.environment === "all") {
			for (const environmentKey in this.buildConfig.environments) {
				if (this.buildConfig.environments.hasOwnProperty(environmentKey)) {
					const environment = new Environment(environmentKey, this);

					this.environments.push(environment);
				}
			}
		}
		else if (this.buildConfig.environments[this.options.environment] !== void 0) {
			const environment = new Environment(this.options.environment, this);

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
			await environment.build()
				.catch((error) => {
					success = false;

					log("There was an unhandled error in the build.", "FATAL");

					log(error, "DEBUG");
				});
		}

		log.timeEnd("Build", startTime, "MAIN", success);
	}
}

Martelo.defaultTypeBuilders = {
	copy: require("./lib/Builder/GenericBuilder"),
	images: require("./lib/Builder/ImagesBuilder"),
	scripts: require("./lib/Builder/ScriptsBuilder"),
	styles: require("./lib/Builder/StylesBuilder"),
};

Martelo.defaultBuildConfig = {
	baseSourcePath: ".",
	updateRevisionedReferences: "\\.(css|js|html)$",
};

Martelo.defaultRunOptions = {
	environment: "development",
	partial: false,
};

exports = module.exports = Martelo;
