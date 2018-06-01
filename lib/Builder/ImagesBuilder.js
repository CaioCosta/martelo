const imagemin = require("imagemin");


	static get builderType() {
		return "images";
	}
const GenericBuilder = require("./GenericBuilder");

class ImagesBuilder extends GenericBuilder {
	async renderFile(buildFile) {
		await super.renderFile(buildFile);

		if (this.isEnabled("compressImages")) {
			buildFile.buffer = await imagemin.buffer(buildFile.buffer);
		}

		return buildFile;
	}
}

ImagesBuilder.defaultOptions = {
	compressImages: true,
};

exports = module.exports = ImagesBuilder;
