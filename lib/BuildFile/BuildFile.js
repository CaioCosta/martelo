const crypto = require("crypto");
const path = require("path");

class BuildFile {
	constructor(properties) {
		this._ = {
			buffer: null,
			filename: null,
			revisionedFilename: null,
			destination: null,
			revisionedDestination: null,
		};

		Object.keys(BuildFile.defaultProperties).forEach((key) => {
			this[key] = properties[key] || BuildFile.defaultProperties[key];
		});
	}

	get buffer() {
		return this._.buffer;
	}

	set buffer(bufferOrString) {
		let buffer;

		if (bufferOrString !== null) {
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
		this._.revisionedFilename = null;
		this._.destination = null;
		this._.revisionedDestination = null;
	}

	get filename() {
		if (this._.filename === null) {
			const destinationIsFile = (path.basename(this.buildDestination).includes("."));
			let filenameSource = destinationIsFile
				? this.buildDestination
				: this.source;

			this._.filename = (
				(this.prefix || "")
				+ path.basename(filenameSource, path.extname(filenameSource))
				+ (this.suffix || "")
				+ path.extname(filenameSource)
			);
		}

		return this._.filename;
	}

	get revisionedFilename() {
		if ((this._.revisionedFilename === null) && this.enableRevision) {
			const hash = crypto.createHash("md5").update(this.buffer.toString("utf8"))
				.digest("hex").substr(0, 16);

			this._.revisionedFilename = this.filename.replace(/^(.*?)\.(.*)$/, `$1.${hash}.$2`);
		}

		return this._.revisionedFilename;
	}

	get destination() {
		if (this._.destination === null) {
			let destination;
			const destinationIsFile = path.basename(this.buildDestination).includes(".");

			if (destinationIsFile) {
				destination = path.dirname(this.buildDestination);
			}
			else {
				const destinationTree = this.source.split(path.sep);
				const subFolder = path.join.apply(null, destinationTree.slice(1, -1));

				destination = path.join(this.buildDestination, subFolder);
			}

			this._.destination = path.join(destination, this.filename);
		}

		return this._.destination;
	}

	get revisionedDestination() {
		if ((this._.revisionedDestination === null) && this.enableRevision) {
			this._.revisionedDestination = path.join(
				path.dirname(this.destination),
				this.revisionedFilename
			);
		}

		return this._.revisionedDestination;
	}
}

BuildFile.defaultProperties = {
	source: null,
	buildDestination: null,
	enableRevision: false,
	filename: null,
	prefix: "",
	suffix: "",
	buffer: "",
};

exports = module.exports = BuildFile;
