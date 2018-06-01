const autoprefixer = require("autoprefixer");
const CleanCss = require("clean-css");
const postcss = require("postcss");

const GenericBuilder = require("./GenericBuilder");

class CssBuilder extends GenericBuilder {
	async render(buildFiles) {
		let renderedFiles = [];

		for (const buildFile of buildFiles) {
			let mapBuildFile = buildFile.map;

			if (this.isEnabled("autoprefixer")) {
				const processOptions = {
					from: buildFile.source,
					to: buildFile.source,
				};

				if (buildFile.map !== void 0) {
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
		}

		return renderedFiles;
	}
}

CssBuilder.defaultOptions = {
	autoprefixer: true,
	minify: "production",
	map: "development",
};

exports = module.exports = CssBuilder;
