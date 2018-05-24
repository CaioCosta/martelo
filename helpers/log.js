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

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",

	fgBlack: "\x1b[38;5;0m",
	fgGray: "\x1b[38;5;245m",
	fgRed: "\x1b[38;5;124m",
	fgGreen: "\x1b[38;5;40m",
	fgYellow: "\x1b[38;5;220m",
	fgOrange: "\x1b[38;5;166m",
	fgBlue: "\x1b[38;5;25m",
	fgMagenta: "\x1b[38;5;161m",
	fgCyan: "\x1b[38;5;45m",
	fgWhite: "\x1b[38;5;231m",

	ggBlack: "\x1b[48;5;0m",
	bgRed: "\x1b[48;5;124m",
	bgGray: "\x1b[48;5;245m",
	bgGreen: "\x1b[48;5;28m",
	bgYellow: "\x1b[48;5;220m",
	bgOrange: "\x1b[48;5;166m",
	bgBlue: "\x1b[48;5;25m",
	bgMagenta: "\x1b[48;5;162m",
	bgCyan: "\x1b[48;5;45m",
	bgWhite: "\x1b[48;5;231m",
};

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

const levelIcon = {
	DEFAULT: "",
	FATAL: colors.bgRed + colors.fgWhite + "fatal",
	MAIN: "",
	ERROR: colors.bgOrange + colors.fgWhite + "error",
	WARN: colors.bgYellow + colors.fgBlack + "warn",
	INFO: colors.bgBlue + colors.fgWhite + "info",
	DEBUG: colors.bgGray + colors.fgBlack + "debug",
};

const getMessageStart = () => {
	const date = new Date();
	const timeString = `${date.getHours().toString().padStart(2, "0")}`
		+ `:${date.getMinutes().toString().padStart(2, "0")}`
		+ `:${date.getSeconds().toString().padStart(2, "0")}`;

	return `[${colors.fgGray + timeString + colors.reset}]`;
};

const getLogTypeIcon = (logType) => {
	const icon = (levelIcon[logType] || levelIcon.DEFAULT);

	return (icon.length > 0 ? " " : "") + icon + colors.reset;
};

const log = (message, logType) => {
	const args = require("./args");

	const logLevel = (level[logType] !== void 0) ? level[logType] : level.DEFAULT;

	if (args.logLevel >= logLevel) {
		const messageStart = getMessageStart();

		message = message.replace("\n", "\n" + " ".repeat(11));

		console.log(`${messageStart} ${message}`);
	}
};

log.timeEnd = (actionName, startTime, logLevel) => {
	return log(`${actionName} ended after ${log.formatNumber((Date.now() - startTime) / 1000)}s`, logLevel);
};

log.formatEnvironment = (environmentName) => {
	return `${colors.fgCyan + environmentName + colors.reset}`;
};

log.formatType = (type) => {
	return `${colors.fgCyan + type + colors.reset}`;
};

log.formatNumber = (number) => {
	return `${colors.fgGreen + number + colors.reset}`
};

log.formatFilename = (filename) => {
	return `${colors.fgCyan + filename + colors.reset}`;
};

log.colors = colors;
log.level = level;
log.levelStep = levelStep;

exports = module.exports = log;
