/* =====================================================================
 * Log helper
 *
 * ## Log Level info
 * OFF (0) - Nothing goes to the console
 * FATAL (1) - Crippling errors; includes Main Build info
 * ERROR (1, default) - Type errors, misconfiguration, not found etc
 * WARN (2) - No files returned, no files parsed etc
 * INFO (2) - How many files written, how long type build took etc
 * DEBUG (3) - Each file parsed, each file written, each build file modified etc
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
	fgRed: "\x1b[38;5;196m",
	fgGreen: "\x1b[38;5;40m",
	fgYellow: "\x1b[38;5;221m",
	fgOrange: "\x1b[38;5;202m",
	fgBlue: "\x1b[38;5;33m",
	fgMagenta: "\x1b[38;5;161m",
	fgCyan: "\x1b[38;5;45m",
	fgWhite: "\x1b[38;5;231m",

	bgBlack: "\x1b[48;5;0m",
	bgRed: "\x1b[48;5;124m",
	bgGray: "\x1b[48;5;245m",
	bgGreen: "\x1b[48;5;28m",
	bgYellow: "\x1b[48;5;220m",
	bgOrange: "\x1b[48;5;172m",
	bgBlue: "\x1b[48;5;25m",
	bgMagenta: "\x1b[48;5;162m",
	bgCyan: "\x1b[48;5;45m",
	bgWhite: "\x1b[48;5;231m",
};

const level = {
	OFF: 0,
	DEFAULT: 1,
	MAIN: 1,
	FATAL: 1,
	ERROR: 1,
	WARN: 2,
	INFO: 2,
	DEBUG: 3,
};

const levelStep = 1;

const levelIcon = {
	DEFAULT: "",
	MAIN: "",
	FATAL: colors.bgRed + colors.fgWhite + "[f]",
	ERROR: colors.fgOrange + "[e]",
	WARN: colors.fgYellow + "[w]",
	INFO: colors.fgBlue + "[i]",
	DEBUG: colors.fgGray + "[d]",
};

const getMessageStart = (logType = "DEFAULT") => {
	const icon = levelIcon[logType];

	return colors.fgGray + "()=>" + (icon.length > 0 ? " " : "") + icon + colors.reset;
};

const log = (message, logType = "DEFAULT") => {
	const args = require("./args");

	const logLevel = level[logType];

	if (args.logLevel >= logLevel) {
		if (typeof message === "string") {
			message = message.replace("\n", "\n" + " ".repeat(9));
		}

		console.log(getMessageStart(logType), message);
	}
};

log.timeEnd = (actionName, startTime, logType, success = true) => {
	const statusWording = (
		success
			? colors.fgCyan + "completed"
			: colors.bgRed + colors.fgWhite + "failed"
	) + colors.reset;

	return log(
		`${actionName} ${statusWording} after`
		+ ` ${log.formatNumber((Date.now() - startTime) / 1000)}s`,
		logType
	);
};

log.formatEnvironment = (environmentName) => {
	return `${colors.fgYellow + environmentName + colors.reset}`;
};

log.formatType = (type) => {
	return `${colors.fgYellow + type + colors.reset}`;
};

log.formatNumber = (number) => {
	return `${colors.fgGreen + number + colors.reset}`;
};

log.formatFilename = (filename) => {
	return `${colors.fgCyan + filename + colors.reset}`;
};

log.colors = colors;
log.level = level;
log.levelStep = levelStep;

exports = module.exports = log;
