const autoprefixer = require("autoprefixer");
const CleanCss = require("clean-css");
const path = require("path");
const postcss = require("postcss");
const sass = require("node-sass");

const BuildFile = require("../BuildFile/BuildFile");
const TypeBuilder = require("./GenericBuilder");
const promiseHandler = require("../../helpers/promiseHandler");

class StylesBuilder extends TypeBuilder {
	static get builderType() {
		return "styles";
	}

	async render(buildFiles) {
		let renderedFiles = [];

		for (const buildFile of buildFiles) {
			let mapBuildFile = null;
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
				mapBuildFile = new BuildFile({
					source: buildFile.source,
					buildDestination: this.destination,
					buffer: sassResult.map,
					filename: buildFile.filename + ".map",
					disableRevision: true,
				});
			}

			if (this.isEnabled("autoprefixer")) {
				const processOptions = {
					from: buildFile.source,
					to: buildFile.source,
				};

				if (mapBuildFile !== null) {
					processOptions.map = {
						prev: mapBuildFile.buffer.toString("utf8"),
						inline: false,
					};
				}

				const result = await postcss([autoprefixer])
					.process(buildFile.buffer, processOptions);

                buildFile.buffer = result.css;

				if (result.map !== void 0) {
					mapBuildFile.buffer = result.map;
				}
			}

			if (this.isEnabled("minify")) {
				const result = await new CleanCss({
					sourceMap: true,
					returnPromise: true,
				})
					.minify(buildFile.buffer);

				buildFile.buffer = result.styles;

				if (result.map !== void 0) {
					mapBuildFile.buffer = result.map;
				}
			}

			renderedFiles.push(buildFile);

			if (mapBuildFile !== null) {
				renderedFiles.push(mapBuildFile);
			}
		}

		return renderedFiles;
	}
}

StylesBuilder.defaultOptions = {
	autoprefixer: true,
	minify: "production",
	map: "development",
};

exports = module.exports = StylesBuilder;
