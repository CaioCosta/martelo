exports = module.exports = (error, result, resolve, reject) => {
	"use strict";

	return error
		? reject(error)
		: resolve(result);
};
