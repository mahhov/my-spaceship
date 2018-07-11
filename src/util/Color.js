class Color {
	constructor(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.string = `rgb(${this.r}, ${this.g}, ${this.b})`;
	}

	static from255(r, g, b) {
		return new Color(r, g, b);
	}

	static from1(...ones) {
		return new Color(...Color.onesTo255(ones));
	}

	static fromHex(rh, gh, bh, single) {
		return new Color(...Color.hexesTo255([rh, gh, bh], single));
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
