const log = require("./log");

exports = module.exports = (value, expectedFailValue, message, logType = "FATAL", exit = true) => {
	if (value === expectedFailValue) {
		log(message, logType);

		if (exit) {
			process.exit(1);
		}
	}
};
