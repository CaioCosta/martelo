const log = require("./log");

const defaultValues = {
	debug: false,
	logLevel: log.level.DEFAULT,
	quiet: false,
	verbose: false,
	watch: false,
};

const argumentAliases = {
	debug: "d",
	logLevel: "l",
	quiet: "q",
	verbose: "v",
	watch: "w",
};

const argv = require("minimist")(process.argv.slice(2), {
	alias: argumentAliases,
	default: defaultValues,
});

if (argv.verbose) {
	argv.logLevel += log.levelStep;
}

if (argv.quiet) {
	argv.logLevel -= log.levelStep;
}

if (argv.debug) {
	argv.logLevel = log.level.DEBUG;
}

exports = module.exports = argv;
