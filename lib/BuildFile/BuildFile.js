const crypto = require("crypto");
const path = require("path");

class BuildFile {
	static getRevisionedFilename(filePath, contentString) {
		const filename = path.basename(filePath);
		const dirname = path.dirname(filePath);
		const hash = crypto.createHash("md5").update(contentString).digest("hex").substr(0, 16);

		return path.join(dirname, filename.replace(/^(.*?)\.(.*)$/, `$1.${hash}.$2`));
	}

	constructor(source, build, properties) {
		this._ = {};
		this.source = path.join(build.sourcePath, source);
		this.build = build;

		for (var property in properties) {
			if (properties.hasOwnProperty(property)) {
				this[property] = properties[property];
			}
		}
	}

	get buffer() {
		return this._.buffer;
	}

	set buffer(bufferOrString) {
		let buffer;

		if (bufferOrString !== void 0) {
			if (bufferOrString instanceof Buffer) {
				buffer = bufferOrString;
			}
			else if (bufferOrString.toString !== void 0) {
				const string = bufferOrString.toString();

				buffer = new Buffer(string, string.length);
			}
		}

		this._.buffer = buffer;
	}

	set filename(filename) {
		this._.filename = filename;
	}

	get filename() {
		return this._.filename
			|| (this.prefix || "") + path.basename(this.source) + (this.suffix || "");
	}

	get destination() {
		let destination;
		const destinationIsFile = (path.basename(this.build.destination).indexOf(".") > -1);

		if (destinationIsFile || (this.build.environment.config.forceDestinationToFile === true)) {
			destination = this.build.destination;
		}
		else {
			let source = path.relative(this.build.sourcePath, this.source);
			let subFolder;

			if (this.build.isEnabled("flatten")) {
				subFolder = ".";
			}
			else {
				let destinationTree = source.split(path.sep);

				subFolder = path.join.apply(null, destinationTree.slice(1, -1));
			}

			destination = path.join(this.build.destination, subFolder, path.basename(this.source));
		}

		destination = path.join(
			path.dirname(destination),
			(
				this.build.isEnabled("revision")
					? BuildFile.getRevisionedFilename(this.filename, this.buffer)
					: this.filename
			)
		);

		return destination;
	}
}

exports = module.exports = BuildFile;
