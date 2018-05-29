const Environment = require("./lib/Environment/Environment");

const args = require("./helpers/args");
const log = require("./helpers/log");

class Martelo {
	constructor(buildConfig, options) {
		log(`Init`, "MAIN");

		this.buildConfig = Object.assign({}, Martelo.defaultBuildConfig, buildConfig);
		this.environments = [];
		this.options = Object.assign({}, Martelo.defaultOptions, options);
		this.typeBuilders = Object.assign({}, Martelo.defaultTypeBuilders, this.buildConfig.typeBuilders);

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
		log("Starting builds", "MAIN");

		const startTime = Date.now();

		for (const environment of this.environments) {
			await environment.build();
		}

		log.timeEnd("Building", startTime, "MAIN");
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

Martelo.defaultOptions = {
	environment: "development",
	partial: false,
};

exports = module.exports = Martelo;
