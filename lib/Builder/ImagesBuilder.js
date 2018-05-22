const imagemin = require("imagemin");

const TypeBuilder = require("./GenericBuilder");

class ImagesBuilder extends TypeBuilder {
	static get builderType() {
		return "images";
	}

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
