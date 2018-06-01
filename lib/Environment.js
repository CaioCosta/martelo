const del = require("del");
const path = require("path");

const FsPromise = require("./FsPromise");

const failTest = require("../helpers/failTest");
const log = require("../helpers/log");

class Environment {
	constructor(key, environmentConfig, marteloConfig) {
		this.baseSourcePath = marteloConfig.baseSourcePath;
		this.builds = marteloConfig.builds;
		this.builderPaths = marteloConfig.builderPaths;
		this.config = Object.assign({}, Environment.defaultConfig, environmentConfig);
		this.key = key;
		this.updateRevisionedReferences = marteloConfig.updateRevisionedReferences;

		this.builders = [];
		this.files = [];
		this.hasRevisionedAssets = false;
		this.manifest = {};
		this.manifestFilename = "manifest.json";

		if (this.config.ignore === false) {
			this.instantiateBuilders();
		}
		else {
			log(`Environment ${key} is being ignored.`, "INFO");
		}
	}

	instantiateBuilders() {
		for (const buildKey in this.builds) {
			if (this.builds.hasOwnProperty(buildKey)) {
				const buildConfig = this.builds[buildKey];
				const Builder = require(this.builderPaths[buildConfig.type]);

				if (Builder !== void 0) {
					const builder = new Builder(buildKey, buildConfig, this);

					this.builders.push(builder);

					this.hasRevisionedAssets = this.hasRevisionedAssets
						|| builder.isEnabled("revision");
				}
				else {
					log(`There is no builder for ${buildConfig.type}`, "WARN");
				}
			}
		}
	}

	async runBuilders() {
		const startTime = Date.now();

		log(`Building ${log.formatEnvironment(this.key)}`, "INFO");

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

		await this.writeFiles(this.files);

		log.timeEnd(
			`Environment ${log.formatEnvironment(this.key)}`,
			startTime,
			"INFO"
		);
	}

	updateBuilderFileList(builder) {
		for (const file of builder.files) {
			this.files.push(file);

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
				log("Manifest file already exists and will be updated", "INFO");

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

		for (let i = 0; i < this.files.length; i++) {
			const file = this.files[i];

			if (filenameRegex.test(file.destination)) {
				for (const originalFilename in this.manifest) {
					if (this.manifest.hasOwnProperty(originalFilename)) {
						const revisionedFilename = this.manifest[originalFilename];
						const updateRegexp = new RegExp(originalFilename, "g");

						file.buffer = file.buffer.toString("utf8")
							.replace(updateRegexp, revisionedFilename);

					}
				}

				log(
					`Updating ${path.basename(file.destination)} with revisioned references`,
					"DEBUG"
				);
			}
		}
	}

	writeFiles(files) {
		let filesToWrite = [];
		const writePromises = [];

		for (const file of files) {
			filesToWrite[(file.revisionedDestination || file.destination)] = file.buffer;
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

						log(`File written: ${filePath}`, "DEBUG");

						return filePath;
					})
					.catch((error) => {
						log(`File ${log.formatFilename(filePath)} couldn't be written`, "ERROR");
						log(error, "DEBUG");
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
