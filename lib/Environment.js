const del = require("del");
const path = require("path");

const FsPromise = require("./FsPromise");
const Logger = require("./Logger");

const failTest = require("../helpers/failTest");

class Environment {
	constructor(key, environmentConfig, marteloConfig) {
		this.baseSourcePath = marteloConfig.baseSourcePath;
		this.builds = marteloConfig.builds;
		this.builderPaths = marteloConfig.builderPaths;
		this.config = Object.assign({}, Environment.defaultConfig, environmentConfig);
		this.key = key;
		this.updateRevisionedReferences = marteloConfig.updateRevisionedReferences;

		this.builders = [];
		this.buildFiles = [];
		this.hasRevisionedAssets = false;
		this.manifest = {};
		this.manifestFilename = "manifest.json";

		if (this.config.ignore === false) {
			this.instantiateBuilders();
		}
		else {
			Logger.log(`Environment [[e:${key}]] is being ignored.`, "INFO");
		}
	}

	instantiateBuilders() {
		for (const buildKey in this.builds) {
			if (this.builds.hasOwnProperty(buildKey)) {
				const buildConfig = this.builds[buildKey];
				const builderPath = this.builderPaths[buildConfig.type];

				if (builderPath !== void 0) {
					const Builder = require(this.builderPaths[buildConfig.type]);
					const builder = new Builder(buildKey, buildConfig, this);

					this.builders.push(builder);

					this.hasRevisionedAssets = this.hasRevisionedAssets
						|| builder.isEnabled("revision");
				}
				else {
					Logger.log(`There is no builder for [[b:${buildConfig.type}]]`, "WARN");
				}
			}
		}
	}

	async runBuilders() {
		const startTime = Date.now();

		Logger.log(`Building [[e:${this.key}]]`, "INFO");

		await del(this.config.path);

		failTest(this.builders.length, 0, "No builders found", "ERROR", false);

		for (const builder of this.builders) {
			await builder.run();

			this.updateBuilderFileList(builder);
		}

		if (this.hasRevisionedAssets) {
			await this.updateManifest();
			this.updateFilesWithRevisionedFilenames();
		}

		await this.writeFiles(this.buildFiles);

		Logger.timeEnd(`Environment [[e:${this.key}]]`, startTime, "INFO");
	}

	async runWatchers() {
		for (const builder of this.builders) {
			await builder.watch();
		}
	}

	updateBuilderFileList(builder) {
		for (const file of builder.buildFiles) {
			this.buildFiles.push(file);

			if (file.revisionedDestination !== null) {
				this.manifest[file.destination] = file.revisionedDestination;
			}
		}
	}

	updateManifest() {
		const filePath = path.join(this.config.path, this.manifestFilename);

		return FsPromise.stat(filePath)
			.then(() => FsPromise.readFile(filePath))
			.then((manifestFileBuffer) => {
				// Manifest file exists and will be updated
				Logger.log("Manifest file already exists and will be updated", "INFO");

				if (manifestFileBuffer !== void 0) {
					this.manifest = Object.assign(
						{},
						JSON.parse(manifestFileBuffer.toString("utf8")),
						this.manifest
					);
				}
			})
			.catch(() => {
				// log("There was an error when trying to update the manifest file", "ERROR");
			});
	}

	updateFilesWithRevisionedFilenames() {
		const filenameRegex = new RegExp(this.updateRevisionedReferences);

		for (let i = 0; i < this.buildFiles.length; i++) {
			const file = this.buildFiles[i];

			if (filenameRegex.test(file.destination)) {
				for (const originalFilename in this.manifest) {
					if (this.manifest.hasOwnProperty(originalFilename)) {
						const revisionedFilename = this.manifest[originalFilename];
						const updateRegexp = new RegExp(originalFilename, "g");

						file.buffer = file.buffer.toString("utf8")
							.replace(updateRegexp, revisionedFilename);

					}
				}

				Logger.log(
					`Updating [[f:${path.basename(file.destination)}]] with revisioned references`,
					"DEBUG"
				);
			}
		}
	}

	writeFiles(buildFiles) {
		let filesToWrite = [];
		const writePromises = [];

		for (const buildFile of buildFiles) {
			filesToWrite[(buildFile.revisionedDestination || buildFile.destination)]
				= buildFile.buffer;
		}

		if (Object.keys(this.manifest).length > 0) {
			filesToWrite[this.manifestFilename] = JSON.stringify(this.manifest, null, 2);
		}

		for (const filePath in filesToWrite) {
			if (filesToWrite.hasOwnProperty(filePath)) {
				const fileDestination = path.join(this.config.path, filePath);

				let promise = FsPromise.createDirectory(path.dirname(fileDestination))
					.then(async () => {
						await FsPromise.writeFile(fileDestination, filesToWrite[filePath]);

						Logger.log(`File written: [[f:${filePath}]]`, "DEBUG");

						return filePath;
					})
					.catch((error) => {
						Logger.log(`File [[f:${filePath}]] couldn't be written`, "ERROR");
						Logger.log(error, "DEBUG");
					});

				writePromises.push(promise);
			}
		}

		return Promise.all(writePromises);
	}
}

Environment.defaultConfig = {
	path: ".",
	ignore: false,
};

module.exports = Environment;
