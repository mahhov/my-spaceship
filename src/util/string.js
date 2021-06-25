// convert 'inc    +20% yoHow_ARE_YouToday'' to 'Inc +20% yo how are you today'
const toUiString = string => string ? string
	.split(/[ _]+|([A-Z]+[a-z]*)/)
	.filter(s => s)
	.map(s => s.toLowerCase())
	.join(' ')
	.replace(/^./, m => m.toUpperCase()) : '';

const enumName = (id, enumObj) => toUiString(Object.keys(enumObj)[id]);

export {
	toUiString,
	enumName,
};
