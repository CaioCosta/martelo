const fs = require("fs");
const mkdirp = require("mkdirp");

const promiseHandler = require("../../helpers/promiseHandler");

class FsPromise {
	static createDirectory(directory) {
		return new Promise((resolve, reject) => {
			mkdirp(directory, (error) => {
				promiseHandler(error, true, resolve, reject);
			});
		});
	}

	static stat(filePath) {
		return new Promise((resolve, reject) => {
			fs.stat(filePath, (error, result) => {
				promiseHandler(error, result, resolve, reject);
			});
		});
	}

	static readFile(filePath) {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, (error, result) => {
				promiseHandler(error, result, resolve, reject);
			});
		})
			.catch((error) => {
				console.log("Could not read file", error);
			});
	}

	static writeFile(filePath, contents) {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath, contents, (error, result) => {
				promiseHandler(error, filePath, resolve, reject);
			});
		})
			.catch((error) => {
				console.log("Could not write file", error);
			});
	}

	static renameFile(oldName, newName) {
		return new Promise((resolve, reject) => {
			fs.rename(oldName, newName, (error, result) => {
				promiseHandler(error, result, resolve, reject);
			});
		})
			.catch((error) => {
				console.log("Could not rename file", error);
			});
	}
}

exports = module.exports = FsPromise;
