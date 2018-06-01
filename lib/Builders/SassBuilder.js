const path = require("path");
const sass = require("node-sass");

const BuildFile = require("../BuildFile");
const CssBuilder = require("./CssBuilder");

const promiseHandler = require("../../helpers/promiseHandler");

class SassBuilder extends CssBuilder {
	async render(buildFiles) {
		let renderedFiles = [];

		for (const buildFile of buildFiles) {
			let renderOptions = {
				file: buildFile.source,
				includePaths: [
					path.resolve(path.dirname(buildFile.source)),
					path.resolve(this.baseSourcePath),
				],
				outputStyle: "compressed",
			};

			if (this.isEnabled("map")) {
				renderOptions.sourceMap = buildFile.filename + ".map";
			}

			const sassResult = await new Promise((resolve, reject) => {
				sass.render(renderOptions, (error, result) => {
					promiseHandler(error, result, resolve, reject);
				});
			});

			buildFile.buffer = sassResult.css;

			if (sassResult.map) {
				buildFile.map = new BuildFile({
					source: buildFile.source,
					buildDestination: this.destination,
					buffer: sassResult.map,
					filename: buildFile.filename + ".map",
					enableRevision: false,
				});
			}

			renderedFiles.push(buildFile);
		}

		return super.render(renderedFiles);
	}
}

exports = module.exports = SassBuilder;
