const glob = require("glob");
const path = require("path");

const BuildFile = require("../BuildFile");
const FileWatcher = require("../FileWatcher");
const FsPromise = require("../FsPromise");
const Logger = require("../Logger");

const promiseHandler = require("../../helpers/promiseHandler");

class GenericBuilder {
	constructor(key, config, environment) {
		this.key = key;
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

	parseSourceFilePaths() {
		return new Promise((resolve, reject) => {
			let sourceString;

			if (typeof this.sourceFiles === "string") {
				sourceString = this.sourceFiles;
			}
			else if (Array.isArray(this.sourceFiles)) {
				sourceString = this.sourceFiles.join(",");
			}

			if (sourceString !== void 0) {
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
			}
			else {
				Logger.log(`Build source must be a string or an array of strings.`, "ERROR");
			}
		});
	}

	async run() {
		const startTime = Date.now();

		Logger.log(`Building [[e:${this.environment.key}]] [[b:${this.key}]]`, "INFO");

		await this.parseSourceFilePaths();
		this.createBuildFiles();
		this.buildFiles = await this.render(this.buildFiles);

		this.updateFileList(this.buildFiles);

		Logger.timeEnd(`[[e:${this.environment.key}]] [[b:${this.key}]]`, startTime, "INFO");
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
			Logger.log(`No files to build in [[b:${this.constructor.builderType}]]`, "WARN");
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

				if (file.map !== void 0) {
					this.files.push(file.map);
				}
			}
		}
	}
}

GenericBuilder.defaultOptions = {
	flatten: false,
	revision: "production",
};

exports = module.exports = GenericBuilder;
