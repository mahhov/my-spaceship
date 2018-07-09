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
}

module.exports = Color;
