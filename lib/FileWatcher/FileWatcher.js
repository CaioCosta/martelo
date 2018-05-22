const _ = require("lodash");
const chokidar = require("chokidar");

class FileWatcher {
	constructor(filePaths, callback) {
		this.filePaths = filePaths;
		this.onChange = _.throttle(callback, FileWatcher.watchThreshold, { leading: false });

		this.observe();
	}

	observe() {
		this.watcher = chokidar.watch(this.filePaths, {
			ignored: /(^|[\/\\])\../,
			persistent: true,
		});

		// Add event listeners.
		this.watcher
			.on("change", this.onChange);
	}
}

FileWatcher.watchThreshold = 100;

exports = module.exports = FileWatcher;
