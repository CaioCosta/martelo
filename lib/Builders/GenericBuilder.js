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
		this.buildFiles = [];
		this.manifest = {};
		this.options = Object.assign(
			{},
			this.constructor.defaultOptions,
			GenericBuilder.defaultOptions,
			(config.options || {})
		);
		this.baseSourcePath = environment.baseSourcePath;

		BuildFile.defaultProperties.enableRevision = this.isEnabled("revision");
	}

	isEnabled(settingKey) {
		return (this.options[settingKey] === true)
			|| (this.options[settingKey] === this.environment.key);
	}

	parseFilePaths(sourceFiles) {
		return new Promise((resolve, reject) => {
			let sourceString;

			if (typeof sourceFiles === "string") {
				sourceString = sourceFiles;
			}
			else if (Array.isArray(sourceFiles)) {
				sourceString = sourceFiles.join(",");

				if (sourceFiles.length > 1) {
					sourceString = `{${sourceString}}`;
				}
			}

			if (sourceString !== void 0) {
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

		const parsedFilePaths = await this.parseFilePaths(this.config.source);
		const buildFiles = this.createBuildFiles(parsedFilePaths);
		const renderedBuildFiles = await this.render(buildFiles);

		this.updateFileList(renderedBuildFiles);

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
		if (this.config.watch !== void 0) {
			const resolvedFilePaths = [];

			for (const filePath of this.config.watch) {
				resolvedFilePaths.push(path.join(this.baseSourcePath, filePath));
			}

			await new FileWatcher(resolvedFilePaths, async () => {
				const startTime = Date.now();

				Logger.log(
					`[[a:watch]] Building [[e:${this.environment.key}]] [[b:${this.key}]]`,
					"MAIN"
				);

				await this.run();
				await this.environment.writeFiles(this.buildFiles);

				Logger.timeEnd(
					`[[a:watch]] [[e:${this.environment.key}]] [[b:${this.key}]]`,
					startTime,
					"MAIN"
				);
			});
		}
	}

	createBuildFiles(filePaths) {
		const buildFiles = [];

		for (const filePath of filePaths) {
			let buildDestination = this.destination;

			if (this.isEnabled("flatten")) {
				buildDestination = path.join(buildDestination, path.basename(filePath));
			}

			buildFiles.push(new BuildFile({
				source: path.join(this.baseSourcePath, filePath),
				buildDestination: buildDestination,
			}));
		}

		if (buildFiles.length === 0) {
			Logger.log(`No files to build in [[b:${this.key}]]`, "WARN");
		}

		return buildFiles;
	}

	updateFileList(buildFiles) {
		for (const buildFile of buildFiles) {
			if (Array.isArray(buildFile)) {
				this.updateFileList(buildFile);
			}
			else if (buildFile) {
				this.buildFiles.push(buildFile);

				if (buildFile.map !== void 0) {
					this.buildFiles.push(buildFile.map);
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
