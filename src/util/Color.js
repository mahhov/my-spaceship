import {clamp} from './Number.js';

const SHADE_ADD = .2;

class Color {
	constructor(r, g, b, a = 1) {
		this.r = clamp(r, 0, 255);
		this.g = clamp(g, 0, 255);
		this.b = clamp(b, 0, 255);
		this.a = clamp(a, 0, 1);
		this.string = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}

	static from255(r, g, b, a) {
		return new Color(r, g, b, a);
	}

	static from1(r1, g1, b1, a) {
		return new Color(...[r1, g1, b1].map(Color.oneTo255), a);
	}

	static fromHex(rh, gh, bh, a) {
		return new Color(...[rh, gh, bh].map(Color.hexTo255), a)
	}

	static fromHexString(hex) {
		if (hex[0] === '#')
			hex = hex.substr(1);

		if (hex.length === 3)
			return Color.from255(
				Color.hexTo255(parseInt(hex[0], 16)),
				Color.hexTo255(parseInt(hex[1], 16)),
				Color.hexTo255(parseInt(hex[2], 16)));

		return Color.from255(
			parseInt(hex.substr(0, 2), 16),
			parseInt(hex.substr(2, 2), 16),
			parseInt(hex.substr(4, 2), 16));
	}

	multiply(mult) {
		return new Color(this.r * mult, this.g * mult, this.b * mult, this.a);
	}

	multiplyFromWhite(mult) {
		return new Color(
			255 - (255 - this.r) * mult,
			255 - (255 - this.g) * mult,
			255 - (255 - this.b) * mult,
			this.a);
	}

	alphaMultiply(mult) {
		return new Color(this.r, this.g, this.b, this.a * mult);
	}

	avgWhite(weight = .5) {
		let iweight = 1 - weight;
		return new Color(
			this.r * iweight + weight * 255,
			this.g * iweight + weight * 255,
			this.b * iweight + weight * 255,
			this.a);
	}

	get() {
		return this.string;
	}

	// shade should be 0 (no shading) to 1 (maximum shading)
	getShade(shade = 1) {
		if (shade === 1)
			return this.shadeString || (this.shadeString = this.multiply(1 + SHADE_ADD).get());
		return this.multiply(1 + SHADE_ADD * shade).get();
	}

	getAlpha(alphaMult = 1) {
		const NO_COLOR = Color.from1(0, 0, 0, 0);
		if (alphaMult === 1)
			return this.string;
		if (alphaMult === 0)
			return NO_COLOR.get();
		return this.alphaMultiply(alphaMult).get();
	}

	static hexTo255(hex) {
		return hex * 17
	}

	static oneTo255(one) {
		return parseInt(one * 255);
	}
}

Color.WHITE = Color.from1(0, 0, 0);
Color.BLACK = Color.from1(0, 0, 0);

export default Color;
