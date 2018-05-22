/* =====================================================================
 * Log helper
 *
 * ## Log Level info
 * OFF (0) - Nothing goes to the console
 * FATAL (1) - Crippling errors; includes Main Build info
 * ERROR (2, default) - Type errors, misconfiguration, not found etc
 * WARN (3) - No files returned, no files parsed etc
 * INFO (4) - How many files written, how long type build took etc
 * DEBUG (5) - Each file parsed, each file written, each build file modified etc
 *
 * args.verbose adds one
 * args.quiet subtracts one
 * ===================================================================== */

const level = {
	DEFAULT: 1,
	OFF: 0,
	FATAL: 1,
	MAIN: 1,
	ERROR: 1,
	WARN: 2,
	INFO: 2,
	DEBUG: 3,
};

const levelStep = 1;

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",

	fgBlack: "\x1b[30m",
	fgRed: "\x1b[31m",
	fgGreen: "\x1b[32m",
	fgYellow: "\x1b[33m",
	fgBlue: "\x1b[34m",
	fgMagenta: "\x1b[35m",
	fgCyan: "\x1b[36m",
	fgWhite: "\x1b[37m",

	bgBlack: "\x1b[40m",
	bgRed: "\x1b[41m",
	bgGreen: "\x1b[42m",
	bgYellow: "\x1b[43m",
	bgBlue: "\x1b[44m",
	bgMagenta: "\x1b[45m",
	bgCyan: "\x1b[46m",
	bgWhite: "\x1b[47m",
};

const marteloIcon = String.fromCodePoint(128296);

const getMessageStart = () => {
	const date = new Date();
	const timeString = `${date.getHours().toString().padStart(2, "0")}`
		+ `:${date.getMinutes().toString().padStart(2, "0")}`
		+ `:${date.getSeconds().toString().padStart(2, "0")}`
		+ `.${date.getMilliseconds().toString().padStart(3, "0")}`;

	return `${colors.bgYellow + colors.fgBlack + marteloIcon + colors.reset}`
		+ ` ${colors.bright}[${colors.fgCyan + timeString + colors.reset + colors.bright}]${colors.reset}`;
};

const log = (message, logLevel) => {
	const args = require("./args");

	logLevel = (logLevel !== void 0) ? logLevel : level.DEFAULT;

	if (args.logLevel >= logLevel) {
		console.log(`${getMessageStart()} ${message}`);
	}
};

log.timeEnd = (actionName, startTime, logLevel) => {
	return log(`${actionName} ended after ${log.formatNumber((Date.now() - startTime) / 1000)}s`, logLevel);
};

log.formatEnvironment = (environmentName) => {
	return `${colors.bright + colors.fgMagenta + environmentName + colors.reset}`;
};

log.formatNumber = (number) => {
	return `${colors.bright + colors.fgGreen + number + colors.reset}`
};

log.formatFilename = (filename) => {
	return `${colors.fgCyan + filename + colors.reset}`;
};

log.colors = colors;
log.level = level;
log.levelStep = levelStep;

exports = module.exports = log;
