class Color {
	constructor(r, g, b, a = 1) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		this.string = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}

	static from255(r, g, b, a) {
		return new Color(r, g, b, a);
	}

	static from1(r1, g1, b1, a) {
		return new Color(...Color.onesTo255([r1, g1, b1]), a);
	}

	static fromHex(rh, gh, bh, single, a) {
		return new Color(...Color.hexesTo255([rh, gh, bh], single), a);
	}

	static fromHexString(hex) {
		if (hex[0] === '#')
			hex = hex.substr(1);
		return Color.from255(
			parseInt(hex.substr(0, 2), 16),
			parseInt(hex.substr(2, 2), 16),
			parseInt(hex.substr(4, 2), 16));
	}

	multiply(mult) {
		return new Color(this.r * mult, this.g * mult, this.b * mult);
	}

	get() {
		return this.string;
	}

	static hexTo255(hex, single) {
		return hex / (single ? 0xf : 0xff) * 255;
	}

	static hexesTo255(hexes, single) {
		return hexes.map(hex => Color.hexTo255(hex, single));
	}

	static oneTo255(one) {
		return parseInt(one * 255);
	}

	static onesTo255(ones) {
		return ones.map(Color.oneTo255);
	}
}

module.exports = Color;
