const Keymapping = require('./Keymapping');
const IntersectionFinder = require('./intersection/IntersectionFinder');
const Rock = require('./entities/Rock');
const Player = require('./entities/Player');

const invSqrt2 = 1 / Math.sqrt(2);

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
        let playerIntersectionHandle = this.intersectionFinder.addEntity(this.intersectionFinder.FRIENDLY_UNIT, this.player.getBounds());
        this.player.setIntersectionHandle(playerIntersectionHandle);
    }

    iterate(controller, painter) {
        this.movePlayer(controller);

        this.rocks.forEach(rock =>
            rock.paint(painter));

        this.player.paint(painter);
    }

    movePlayer(controller) {
        let left = this.keymapping.isActive(controller, this.keymapping.MOVE_LEFT);
        let up = this.keymapping.isActive(controller, this.keymapping.MOVE_UP);
        let right = this.keymapping.isActive(controller, this.keymapping.MOVE_RIGHT);
        let down = this.keymapping.isActive(controller, this.keymapping.MOVE_DOWN);

        let dx = 0, dy = 0;

        if (left)
            dx -= 1;
        if (up)
            dy -= 1;
        if (right)
            dx += 1;
        if (down)
            dy += 1;


        if (dx !== 0 && dy !== 0) {
            dx = Math.sign(dx) * invSqrt2;
            dy = Math.sign(dy) * invSqrt2;
        }

        let canMove = this.intersectionFinder.canMove(this.intersectionFinder.FRIENDLY_UNIT, this.player.getX(), this.player.getY(), dx, dy, player.getSpeed());
        this.player.move(dx * canMove, dy * canMove);
    }
}

module.exports = Logic;
