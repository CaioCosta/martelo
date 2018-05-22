const path = require("path");
const uglify = require("uglify-js");

const BuildFile = require("../BuildFile/BuildFile");
const TypeBuilder = require("./GenericBuilder");
const FsPromise = require("../FsPromise/FsPromise");
const promiseHandler = require("../../helpers/promiseHandler");

class ScriptsBuilder extends TypeBuilder {
	static get builderType() {
		return "scripts";
	}

	async render(buildFiles) {
		const renderedFiles = [];
		const fileSourceCode = {};
		const renderOptions = {};

		if (this.isEnabled("map")) {
			renderOptions.sourceMap = {
				url: path.basename(this.destination) + ".map",
			};
		}

		if (!this.isEnabled("minify")) {
			renderOptions.compress = false;
			renderOptions.mangle = false;
		}

		for (const buildFile of buildFiles) {
			const buffer = await FsPromise.readFile(buildFile.source);

			fileSourceCode[buildFile.source] = buffer.toString("utf8");
		}

		const uglifyResult = await new Promise((resolve, reject) => {
			let minified = uglify.minify(fileSourceCode, renderOptions);

			promiseHandler(!minified, minified, resolve, reject);
		});

		if (uglifyResult.code) {
			renderedFiles.push(new BuildFile(this.destination, this, {
				buffer: uglifyResult.code,
			}));

			if (uglifyResult.map) {
				renderedFiles.push(new BuildFile(this.destination, this, {
					filename: path.basename(this.destination) + ".map",
					buffer: uglifyResult.map,
				}));
			}
		}

		return renderedFiles;
	}
}

ScriptsBuilder.defaultOptions = {
	minify: "production",
	map: "development",
};

module.exports = ScriptsBuilder;
