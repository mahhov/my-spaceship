const Keymapping = require('./Keymapping');
const IntersectionFinder = require('./intersection/IntersectionFinder');
const Rock = require('./entities/Rock');
const Player = require('./entities/Player');

class Logic {
    constructor(controller, painter) {
        this.controller = controller;
        this.painter = painter;
        this.keymapping = new Keymapping();
        this.intersectionFinder = new IntersectionFinder();

        this.rocks = [];
        for (let i = 0; i < 100; i++) {
            let rock = new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1);
            this.rocks.push(rock);
            this.intersectionFinder.addEntity(this.intersectionFinder.PASSIVE, rock.getBounds());
        }

        this.player = new Player(.5, .5);
        this.intersectionFinder.addEntity(this.intersectionFinder.FRIENDLY_UNIT, this.player.getBounds())
    }

    iterate(controller, painter) {
        this.movePlayer(controller);

        this.rocks.forEach(rock =>
            rock.paint(painter));

        this.player.paint(painter);
    }

    movePlayer(controller) {
        if (this.keymapping.isActive(controller, this.keymapping.MOVE_LEFT))
            this.player.moveLeft();
        if (this.keymapping.isActive(controller, this.keymapping.MOVE_UP))
            this.player.moveUp();
        if (this.keymapping.isActive(controller, this.keymapping.MOVE_RIGHT))
            this.player.moveRight();
        if (this.keymapping.isActive(controller, this.keymapping.MOVE_DOWN))
            this.player.moveDown();
    }
}

module.exports = Logic;
