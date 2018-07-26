class Logger {
	static setCurrentLogLevel(level) {
		this.currentLogLevel = level;
	}

	static getCurrentLogLevel() {
		return this.currentLogLevel || level.DEFAULT;
	}

	static getLevelStep() {
		return 1;
	}

	static getLevel(levelName) {
		return level[levelName] || level.DEFAULT;
	}

	static log(message, logType = "DEFAULT") {
		const logLevel = level[logType];

		if (this.getCurrentLogLevel() >= logLevel) {
			let logMessage = "";

			if (typeof message === "string") {
				logMessage = formatMessage(message);
			}
			else if (Array.isArray(message)) {
				let multilineMessage = "";

				for (let i = 0; i < message.length; i++) {
					const line = message[i];

					if (i === 0) {
						multilineMessage = line;
					}
					else {
						multilineMessage += "\n" + " ".repeat(5) + line;
					}
				}

				logMessage = formatMessage(multilineMessage);
			}
			else {
				logMessage = message;
			}

			// eslint-disable-next-line no-console
			console.log(this.getMessageStart(logType), logMessage);
		}
	}

	static timeEnd(actionName, startTime, logType, success = true) {
		const statusWording = (success
			? colors.fgGreen + "completed"
			: colors.bgRed + colors.fgWhite + "failed"
		) + colors.reset;

		return this.log(
			`${actionName} ${statusWording} after [[n:${((Date.now() - startTime) / 1000)}]]s`,
			logType
		);
	}

	static getMessageStart(logType = "DEFAULT") {
		const icon = levelIcon[logType];

		return colors.fgGray + "()=>" + (icon.length > 0 ? " " : "") + icon + colors.reset;
	}
}

const formatMessage = (message) => {
	for (var formatKey in formattingColors) {
		if (formattingColors.hasOwnProperty(formatKey)) {
			const formattingRegex = new RegExp(`\\[\\[${formatKey}:(.*?)\\]\\]`, "g");
			const color = formattingColors[formatKey];

			message = message.replace(formattingRegex, color + "$1" + colors.reset);
		}
	}

	return message;
};

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
	fgMagenta: "\x1b[38;5;198m",
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

const formattingColors = {
	a: colors.bgBlue + colors.fgWhite, // action
	b: colors.fgOrange, // build
	e: colors.fgYellow, // environment
	f: colors.fgGreen, // filename
	n: colors.fgCyan, // number
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

const levelIcon = {
	DEFAULT: "",
	MAIN: "",
	FATAL: colors.bgRed + colors.fgWhite + "[f]",
	ERROR: colors.fgOrange + "[e]",
	WARN: colors.fgYellow + "[w]",
	INFO: colors.fgBlue + "[i]",
	DEBUG: colors.fgGray + "[d]",
};

exports = module.exports = Logger;
