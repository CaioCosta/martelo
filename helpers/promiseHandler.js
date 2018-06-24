exports = module.exports = (error, result, resolve, reject) => {
	return error
		? reject(error)
		: resolve(result);
};
