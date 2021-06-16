// convert 'yoHow_ARE_YouToday' to 'Yo how are you today'
const toUiString = string => string.match(/([A-Z]+|^)[a-z]*/g).map(s => s.toLowerCase()).join(' ').replace(/^./, m => m.toUpperCase());

export {
	toUiString,
};
