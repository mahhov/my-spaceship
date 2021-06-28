let getStored = key => JSON.parse(localStorage.getItem(key));
let setStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default {getStored, setStored};
