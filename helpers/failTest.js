const Logger = require("../lib/Logger");

exports = module.exports = (value, expectedFailValue, message, logType = "FATAL", exit = true) => {
	if (value === expectedFailValue) {
		Logger.log(message, logType);

		if (exit) {
			process.exit(1);
		}
	}
};
