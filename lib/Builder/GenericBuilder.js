const glob = require("glob");
const path = require("path");

const BuildFile = require("../BuildFile/BuildFile");
const FileWatcher = require("../FileWatcher/FileWatcher");
const FsPromise = require("../FsPromise/FsPromise");

const log = require("../../helpers/log");
const promiseHandler = require("../../helpers/promiseHandler");

class GenericBuilder {
	constructor(config, environment) {
		this.config = config;
		this.destination = config.destination || "";
		this.environment = environment;
		this.files = [];
		this.manifest = {};
		this.options = Object.assign(
			{},
			this.constructor.defaultOptions,
			GenericBuilder.defaultOptions,
			(config.options || {})
		);
		this.baseSourcePath = environment.baseSourcePath;
		this.sourceFiles = (typeof config.source === "string") ? [config.source] : config.source;

		BuildFile.defaultProperties.enableRevision = this.isEnabled("revision");
	}

	isEnabled(settingKey) {
		return (this.options[settingKey] === true)
			|| (this.options[settingKey] === this.environment.key);
	}

	static get builderType() {
		return "copy";
	}

	async parseSourceFilePaths() {
		this.filePaths = await new Promise((resolve, reject) => {
			let sourceString = this.sourceFiles.join(",");

			if (this.sourceFiles.length > 1) {
				sourceString = `{${sourceString}}`;
			}

			glob(sourceString, {
				cwd: this.baseSourcePath,
				nodir: true,
				nocase: true,
			}, (error, filePaths) => {
				promiseHandler(error, filePaths, resolve, reject);
			});
		});
	}

	async run() {
		const startTime = Date.now();

		log(
			"Building " + log.formatEnvironment(this.environment.key)
			+ " " + log.formatType(this.constructor.builderType),
			"INFO"
		);

		await this.parseSourceFilePaths();
		this.createBuildFiles();
		this.buildFiles = await this.render(this.buildFiles);

		this.updateFileList(this.buildFiles);

		log.timeEnd(
			log.formatEnvironment(this.environment.key)
			+ " " + log.formatType(this.constructor.builderType),
			startTime,
			"INFO"
		);
	}

	async render(buildFiles) {
		for (const buildFile of buildFiles) {
			await this.renderFile(buildFile);
		}

		return buildFiles;
	}

	async renderFile(buildFile) {
		buildFile.buffer = await FsPromise.readFile(buildFile.source);

		return buildFile;
	}

	async watch() {
		const resolvedFilePaths = [];

		for (const filePath of this.config.watch) {
			resolvedFilePaths.push(path.join(this.baseSourcePath, filePath));
		}

		await new FileWatcher(resolvedFilePaths, async () => {
			await this.run();
			await this.environment.builder.writeFiles(this.buildFiles);
		});
	}

	createBuildFiles() {
		this.buildFiles = [];

		for (const filePath of this.filePaths) {
			let buildDestination = this.destination;

			if (this.isEnabled("flatten")) {
				buildDestination = path.join(buildDestination, path.basename(filePath));
			}

			this.buildFiles.push(new BuildFile({
				source: path.join(this.baseSourcePath, filePath),
				buildDestination: buildDestination,
			}));
		}

		if (this.buildFiles.length === 0) {
			log(`No files to build in ${this.constructor.builderType}`, "WARN");
		}

		return this.buildFiles;
	}

	updateFileList(files) {
		for (const file of files) {
			if (Array.isArray(file)) {
				this.updateFileList(file);
			}
			else if (file) {
				this.files.push(file);
			}
		}
	}
}

GenericBuilder.defaultOptions = {
	flatten: false,
	revision: "production",
};

exports = module.exports = GenericBuilder;
