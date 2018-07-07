const makeEnum = (...values) => {
	let enumb = {};
	values.forEach((value, index) => enumb[value] = index);
	return enumb;
};

module.exports = makeEnum;

// todo convert all enums to use makeEnum
