const Logger = require("../lib/Logger");

const defaultValues = {
	config: null,
	debug: false,
	logLevel: Logger.getLevel("DEFAULT"),
	quiet: false,
	verbose: false,
	watch: false,
};

const argumentAliases = {
	config: "c",
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
	argv.logLevel += Logger.getLevelStep();
}

if (argv.quiet) {
	argv.logLevel -= Logger.getLevelStep();
}

if (argv.debug) {
	argv.logLevel = Logger.getLevel("DEBUG");
}

exports = module.exports = argv;
