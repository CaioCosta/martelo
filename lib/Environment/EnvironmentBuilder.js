const del = require("del");
const path = require("path");

const FsPromise = require("../FsPromise/FsPromise");

const log = require("../../helpers/log");

class EnvironmentBuilder {
	constructor(environment) {
		this.environment = environment;

		this.marteloConfig = this.environment.martelo.config;
		this.files = [];
		this.manifest = {};
		this.manifestFilename = "manifest.json";
		this.typeBuilders = [];
		this.hasRevisionedAssets = false;

		this.instantiateTypeBuilders();
	}

	async instantiateTypeBuilders() {
		for (const buildKey in this.marteloConfig.builds) {
			if (this.marteloConfig.builds.hasOwnProperty(buildKey)) {
				const buildConfig = this.marteloConfig.builds[buildKey];
				const TypeBuilder = this.environment.martelo.typeBuilders[buildConfig.type];

				if (TypeBuilder !== void 0) {
					const typeBuilder = new TypeBuilder(buildConfig, this.environment);

					this.typeBuilders.push(typeBuilder);

					this.hasRevisionedAssets = this.hasRevisionedAssets || typeBuilder.isEnabled("revision");
				}
				else {
					// throw Error(`There is no builder for ${buildConfig.type}`);
					log(`There is no builder for ${buildConfig.type}`, log.level.WARN);
				}
			}
		}
	}

	async run() {
		const startTime = Date.now();

		log(`Building ${log.formatEnvironment(this.environment.key)}`, log.level.INFO);

		await del(this.environment.config.path);

		for (const typeBuilder of this.typeBuilders) {
			await typeBuilder.run();

			// if (typeBuilder.config.watch !== void 0) {
			// 	typeBuilder.watch();
			// }

			this.updateBuilderFileList(typeBuilder);
		}

		if (this.hasRevisionedAssets) {
			await this.updateManifest();
			this.updateFilesWithRevisionedFilenames();
		}

		await this.writeFiles(this.files);

		log.timeEnd(`Environment ${log.formatEnvironment(this.environment.key)}`, startTime, log.level.INFO);
	}

	updateBuilderFileList(build) {
		for (const file of build.files) {
			this.files.push(file);
		}
	}

	updateManifest() {
		const filePath = path.join(this.environment.config.path, this.manifestFilename);

		return FsPromise.stat(filePath)
			.then(() => FsPromise.readFile(filePath))
			.then((manifestFileBuffer) => {
				// Manifest file exists and will be updated
				log("Manifest file already exists and will be updated", log.level.INFO);

				if (manifestFileBuffer !== void 0) {
					this.manifest = Object.assign({}, JSON.parse(manifestFileBuffer.toString("utf8")), this.manifest);
				}
			})
			.catch((error) => {
				// log("There was an error when trying to update the manifest file", log.level.ERROR);
			});
	}

	updateFilesWithRevisionedFilenames() {
		for (let i = 0; i < this.files.length; i++) {
			for (const originalFilename in this.manifest) {
				if (this.manifest.hasOwnProperty(originalFilename)) {
					const revisionedFilename = this.manifest[originalFilename];
					const updateRegexp = new RegExp(originalFilename, "g");

					this.files[i].buffer = this.files[i].buffer.toString("utf8")
						.replace(updateRegexp, revisionedFilename);

					log(
						`Updating ${path.basename(this.files.destination)} with revisioned references`,
						log.level.DEBUG
					);
				}
			}
		}
	}

	writeFiles(files) {
		let filesToWrite = [];
		const writePromises = [];

		for (const file of files) {
			filesToWrite[file.destination] = file.buffer;
		}

		if (Object.keys(this.manifest).length > 0) {
			filesToWrite[this.manifestFilename] = JSON.stringify(this.manifest, null, 2);
		}

		for (const filePath in filesToWrite) {
			if (filesToWrite.hasOwnProperty(filePath)) {
				const fileDestination = path.join(this.environment.config.path, filePath);

				let promise = FsPromise.createDirectory(path.dirname(fileDestination))
					.then(async () => {
						await FsPromise.writeFile(fileDestination, filesToWrite[filePath]);

						log(`File written: ${filePath}`, log.level.DEBUG);

						return filePath;
					})
					.catch((error) => {
						log(`File ${log.formatFilename(filePath)} couldn't be written`, log.level.ERROR);
						log(error, log.level.DEBUG);
					});

                writePromises.push(promise);
			}
		}

		return Promise.all(writePromises);
	}
}

exports = module.exports = EnvironmentBuilder;
