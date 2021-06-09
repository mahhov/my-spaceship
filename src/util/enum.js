// makeEnum({'A': 0, 'B': 0, 'C': 0}) == {A: 0, B: 1, C: 2}
const makeEnum = values =>
	Object.fromEntries(Object.keys(values).map((v, i) => [v, i]));

export default makeEnum;
