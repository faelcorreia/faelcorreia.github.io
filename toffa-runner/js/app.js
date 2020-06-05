let game;
var song = false;
var start = false;
var score = 0;
var maxScore = 0;
var spaceKey;

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
        scene: playGame,
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

// playGame scene
class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    preload() {
        this.load.image("background", "assets/ju.png");
        this.load.image("platform", "assets/asfalto.png");
        this.load.image("player", "assets/toffa.png");
        this.load.audio("song", "assets/bg.mp3");
        this.load.image("longneck", "assets/longneck.png");
    }
    create() {
        var bg = this.add.image(806, 394, 'background');
        bg.setAlpha(0.7);
        var style = { font: "65px Arial", fill: "#ff0044", align: "center", stroke: "white", strokeThickness: "4" };
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

        spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // pool
        this.platformPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function (platform) {
                platform.scene.platformGroup.add(platform)
            }
        });

        this.longNeckGroup = this.add.group({
            removeCallback: function (longNeck) {
                longNeck.scene.longNeckPool.add(longNeck)
            }
        });

        // pool
        this.longNeckPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function (longNeck) {
                longNeck.scene.longNeckGroup.add(longNeck)
            }
        });

        // number of consecutive jumps made by the player
        this.playerJumps = 0;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);
        this.addLongNeck(800);
        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, "player");
        var ratio = this.player.displayHeight / this.player.displayWidth;
        this.player.displayWidth = 100;
        this.player.displayHeight = 100 * ratio;
        this.player.setGravityY(gameOptions.playerGravity);

        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);
        var longNeckGroup = this.longNeckGroup;
        this.physics.add.overlap(this.player, this.longNeckGroup, function (player, longNeck) {
            longNeckGroup.killAndHide(longNeck);
            longNeckGroup.remove(longNeck);
            score += 100;
        })
        // checking for input
        this.input.on("pointerdown", this.jump, this);
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
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    addLongNeck(posX) {
        let longNeck;
        if (this.longNeckPool.getLength()) {
            longNeck = this.longNeckPool.getFirst();
            longNeck.x = posX;
            longNeck.active = true;
            longNeck.visible = true;
            this.longNeckPool.remove(longNeck);
        }
        else {
            longNeck = this.physics.add.sprite(posX, 380, "longneck");
            var ratio = longNeck.displayHeight / longNeck.displayWidth;
            longNeck.displayWidth = 30;
            longNeck.displayHeight = longNeck.displayWidth * ratio;
            longNeck.setImmovable(true);
            longNeck.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.longNeckGroup.add(longNeck);
        }
        this.nextLongNeck = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump() {
        start = true;
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
        this.start_music()
        // game over
        if (this.player.y > game.config.height) {
            this.scene.start("PlayGame");
        }
        this.player.x = gameOptions.playerStartPosition;
        // Press spacebar to jump
        if (spaceKey.isDown){
            this.jump()
        }

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

        this.longNeckGroup.getChildren().forEach(function (longNeck) {
            if (longNeck.x < 0) {
                this.longNeckGroup.killAndHide(longNeck);
                this.longNeckGroup.remove(longNeck);
            }
        }, this);
        var rand = 0 + Math.floor((100 - 0) * Math.random());
        if (score % 100 == rand) {
            this.addLongNeck(game.config.width);
        }
        score++;
        if (score > maxScore){
            maxScore = score;
        }
    }

    start_music(){
        if (start) {
            if (!song) {
                var music = this.sound.add("song")
                music.play();
                music.loop = true;
                song = true;
            }
        }
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