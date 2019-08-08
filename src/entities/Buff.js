class Buff {
	static get_(buffs, key) {
		return buffs.reduce((acc, {[key]: value = 0}) => acc + value, 1);
	}

	static moveSpeed(buffs) {
		return Buff.get_(buffs, 'moveSpeed_');
	}

	set moveSpeed(value) {
		this.moveSpeed_ = value;
	}
}

module.exports = Buff;
