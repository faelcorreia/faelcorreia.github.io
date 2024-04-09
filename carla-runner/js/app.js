let game;
let score = 0;
let maxScore = 0;
let song = false;
let gritim = null;
let gambiarraDoGritim = 1;

// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
}

window.onload = function () {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1613,
        height: 788,
        scene: [pauseGame, playGame],
        backgroundColor: 0xFFFFFF,

        // physics settings
        physics: {
            default: "arcade"
        },
        audio: {
            disableWebAudio: true
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

class pauseGame extends Phaser.Scene {
    constructor() {
        super("PauseGame");
    }
    preload() { }
    create() {
        this.input.on("pointerdown", this.start, this);
        this.input.keyboard.on('keydown_SPACE', this.start, this);
        var style = { font: "65px Arial", fill: "#000000", align: "center" };
        if (score > maxScore) {
            maxScore = score;
        }
        this.add.text(450, 150, "Clique ou espaço\n\npara iniciar o jogo", style);
    }
    start() {
        this.scene.start("PlayGame");
    }
    update() {}
};

// playGame scene
class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    preload() {
        this.load.image("background", "assets/lencois_maranhenses.jpg");
        this.load.image("platform", "assets/areia.png");
        this.load.image("player", "assets/carla.png");
        this.load.audio("song", "assets/bg.mp3");
        this.load.audio("gritim", "assets/oba.mp3");
        this.load.image("item", "assets/agua.png");
    }
    create() {
        gritim = this.sound.add("gritim")
        gambiarraDoGritim = 1
        if (!song) {
            var music = this.sound.add("song")
            music.play();
            music.loop = true;
            song = true;
        }
        var bg = this.add.image(806, 394, 'background');
        bg.setAlpha(0.7);
        var style = { font: "65px Arial", fill: "white", align: "center", stroke: "black", strokeThickness: "4" };
        if (score > maxScore) {
            maxScore = score;
        }
        this.add.text(16, 16, "Máximo: " + maxScore, style);
        score = 0;
        this.score = this.add.text(1200, 16, "Pontos: " + score, style);
        // group with all active platforms.
        this.platformGroup = this.add.group({

            // once a platform is removed, it's added to the pool
            removeCallback: function (platform) {
                platform.scene.platformPool.add(platform)
            }
        });

        // pool
        this.platformPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function (platform) {
                platform.scene.platformGroup.add(platform)
            }
        });

        this.itemGroup = this.add.group({
            removeCallback: function (item) {
                item.scene.itemPool.add(item)
            }
        });

        // pool
        this.itemPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function (item) {
                item.scene.itemGroup.add(item)
            }
        });

        // number of consecutive jumps made by the player
        this.playerJumps = 0;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);
        this.addItem(800);
        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, "player");
        var ratio = this.player.displayHeight / this.player.displayWidth;
        this.player.displayWidth = 60;
        this.player.displayHeight = 60 * ratio;
        this.player.setGravityY(gameOptions.playerGravity);

        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);
        var itemGroup = this.itemGroup;
        this.physics.add.overlap(this.player, this.itemGroup, function (player, item) {
            itemGroup.killAndHide(item);
            itemGroup.remove(item);
            score += 100;
        })
        // checking for input
        this.input.on("pointerdown", this.jump, this);
        this.input.keyboard.on('keydown_SPACE', this.jump, this);
    }

    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX) {
        let platform;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        }
        else {
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setScale(0.2)
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    addItem(posX) {
        let item;
        if (this.itemPool.getLength()) {
            item = this.itemPool.getFirst();
            item.x = posX;
            item.active = true;
            item.visible = true;
            this.itemPool.remove(item);
        }
        else {
            item = this.physics.add.sprite(posX, 350, "item");
            item.setScale(0.1)
            var ratio = item.displayHeight / item.displayWidth;
            item.displayWidth = 150;
            item.displayHeight = item.displayWidth * ratio;
            item.setImmovable(true);
            item.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.itemGroup.add(item);
        }
        this.nextItem = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump() {
        if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps++;
        }
    }
    update() {
        this.score.setText("Pontos: " + score)
        // game over
        if (this.player.y > game.config.height) {
            this.scene.start("PlayGame");
        }
        this.player.x = gameOptions.playerStartPosition;


        // recycling platforms
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function (platform) {
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if (platform.x < - platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        if (minDistance > this.nextPlatformDistance) {
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }

        this.itemGroup.getChildren().forEach(function (item) {
            if (item.x < 0) {
                this.itemGroup.killAndHide(item);
                this.itemGroup.remove(item);
            }
        }, this);
        var rand = 0 + Math.floor((100 - 0) * Math.random());
        if (score % 100 == rand) {
            this.addItem(game.config.width);
        }
        if (Math.floor(score / 1000) == gambiarraDoGritim) {
            gambiarraDoGritim = gambiarraDoGritim * 2;
            gritim.play();
        }
        score++;
    }
};
function resize() {
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}