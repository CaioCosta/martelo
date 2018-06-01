const Concat = require("concat-with-sourcemaps");
const path = require("path");
const uglify = require("uglify-js");

const BuildFile = require("../BuildFile/BuildFile");
const GenericBuilder = require("./GenericBuilder");
const FsPromise = require("../FsPromise/FsPromise");

const promiseHandler = require("../../helpers/promiseHandler");

	static get builderType() {
		return "scripts";
	}

class ScriptsBuilder extends GenericBuilder {
	async render(buildFiles) {
		const renderedFiles = [];
		const filesSourceCode = {};

		let fileContents = null;
		let mapFileContents = null;

		for (const buildFile of buildFiles) {
			let buffer = buildFile.buffer;

			if (buffer === void 0) {
				buffer = await FsPromise.readFile(buildFile.source);
			}

			filesSourceCode[buildFile.source] = buffer.toString("utf8");
		}

		if (this.isEnabled("minify")) {
			const renderOptions = {
				compress: false,
				mangle: false,
			};

			if (this.isEnabled("map")) {
				renderOptions.sourceMap = {
					url: path.basename(this.destination) + ".map",
				};
			}

			const uglifyResult = await new Promise((resolve, reject) => {
				let minified = uglify.minify(filesSourceCode, renderOptions);

				promiseHandler(!minified, minified, resolve, reject);
			});

			if (uglifyResult.code) {
				fileContents = uglifyResult.code;
			}

			if (uglifyResult.map) {
				mapFileContents = uglifyResult.map;
			}
		}
		else {
			const concat = new Concat(this.isEnabled("map"), this.destination, "\n");

			for (var filePath in filesSourceCode) {
				if (filesSourceCode.hasOwnProperty(filePath)) {
					concat.add(filePath, filesSourceCode[filePath]);
				}
			}

			if (concat.content) {
				fileContents = concat.content;
			}

			if (concat.sourceMap) {
				mapFileContents = concat.sourceMap;
			}
		}

		if (fileContents !== null) {
			renderedFiles.push(new BuildFile({
				source: this.destination,
				buildDestination: this.destination,
				buffer: fileContents,
			}));
		}

		if (mapFileContents !== null) {
			renderedFiles.push(new BuildFile({
				source: path.basename(this.destination) + ".map",
				buildDestination: this.destination,
				filename: path.basename(this.destination) + ".map",
				buffer: mapFileContents,
				enableRevision: false,
			}));
		}

		return renderedFiles;
	}
}

ScriptsBuilder.defaultOptions = {
	minify: "production",
	map: "development",
};

module.exports = ScriptsBuilder;
