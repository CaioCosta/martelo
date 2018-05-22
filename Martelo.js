const Environment = require("./lib/Environment/Environment");

const args = require("./helpers/args");
const log = require("./helpers/log");

class Martelo {
	constructor(config, typeBuilders) {
		log(`Init (log level: ${args.logLevel})`, log.level.MAIN);

		this.config = config;
		this.environments = [];
		this.typeBuilders = Object.assign({}, Martelo.defaultTypeBuilders, typeBuilders);

		this.updateEnvironments();
	}

	updateEnvironments() {
		const selectedEnvironment = args._[0] || Martelo.defaultEnvironment;

		if (selectedEnvironment === "all") {
			for (const environmentKey in this.config.environments) {
				if (this.config.environments.hasOwnProperty(environmentKey)) {
					const environment = new Environment(environmentKey, this);

					this.environments.push(environment);
				}
			}
		}
		else if (this.config.environments[selectedEnvironment] !== void 0) {
			const environment = new Environment(selectedEnvironment, this);

			this.environments.push(environment);
		}
		else {
			log(`Environment ${selectedEnvironment} doesn't exist`, log.level.ERROR);
		}
	}

	async run() {
		log("Starting builds", log.level.MAIN);

		const startTime = Date.now();

		for (const environment of this.environments) {
			await environment.build();
		}

		log.timeEnd("Building", startTime, log.level.MAIN);
	}
}

Martelo.defaultTypeBuilders = {
	copy: require("./lib/Builder/GenericBuilder"),
	images: require("./lib/Builder/ImagesBuilder"),
	scripts: require("./lib/Builder/ScriptsBuilder"),
	styles: require("./lib/Builder/StylesBuilder"),
};

Martelo.defaultEnvironment = "development";

exports = module.exports = Martelo;
