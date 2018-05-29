const EnvironmentBuilder = require("./EnvironmentBuilder");

const log = require("../../helpers/log");

class Environment {
	constructor(key, martelo) {
		for (const configKey in this.config) {
			if (this.config.hasOwnProperty(configKey)) {
				this[configKey] = this.config[key];
			}
		}

		this.martelo = martelo;
		this.key = key;

		this.builder = null;
		this.config = Object.assign({}, Environment.defaultConfig, this.martelo.buildConfig.environments[this.key]);

		if (this.config.ignore === false) {
			this.builder = new EnvironmentBuilder(this);
		}
		else {
			log(`Environment config for ${key} is not defined or path is missing.`, "ERROR");
		}
	}

	toString() {
		return this.key;
	}

	build() {
		let promise = true;

		if (this.builder !== null) {
			promise = this.builder.run();
		}

		return promise;
	}
}

Environment.defaultConfig = {
	path: ".",
	ignore: false,
};

module.exports = Environment;
