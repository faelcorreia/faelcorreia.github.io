/*
 * Another Runner
 * Um endless runner de plataforma em pixel art.
 *
 * Arte e som são gerados em runtime: nenhuma foto ou asset externo é usado.
 */
(function () {
    "use strict";

    var WIDTH = 960;
    var HEIGHT = 540;
    var PLATFORM_TOP = 432;
    var PLATFORM_HEIGHT = 32;
    var PLAYER_X = 200;
    var PLAYER_SCALE = 3;
    var GRAVITY = 2200;
    var JUMP_FORCE = -760;
    var DOUBLE_JUMP_FORCE = -700;
    var COYOTE_MS = 100;
    var JUMP_BUFFER_MS = 130;
    var BASE_SPEED = 320;
    var MAX_SPEED = 560;
    var FONT = '"Press Start 2P", monospace';
    var BEST_KEY = "another-runner:best";

    var audio = window.AnotherRunnerAudio;

    function readBest() {
        try {
            var value = parseInt(localStorage.getItem(BEST_KEY), 10);
            return isFinite(value) && value > 0 ? value : 0;
        } catch (error) {
            return 0;
        }
    }

    function writeBest(value) {
        try {
            localStorage.setItem(BEST_KEY, String(value));
        } catch (error) {
            /* localStorage indisponível */
        }
    }

    function text(scene, x, y, content, size, color, extra) {
        var style = {
            fontFamily: FONT,
            fontSize: size + "px",
            color: color,
            resolution: 2,
            align: "center"
        };
        if (extra) {
            for (var key in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, key)) {
                    style[key] = extra[key];
                }
            }
        }
        return scene.add.text(x, y, content, style);
    }

    function buildBackdrop(scene) {
        scene.add.image(0, 0, "sky").setOrigin(0, 0);
        var clouds = scene.add.tileSprite(0, 46, WIDTH, 140, "clouds").setOrigin(0, 0);
        var far = scene.add.tileSprite(0, 320, WIDTH, 220, "mountains").setOrigin(0, 0);
        var hills = scene.add.tileSprite(0, 400, WIDTH, 140, "hills").setOrigin(0, 0);

        var haze = scene.add.graphics();
        haze.fillGradientStyle(0x0d0a20, 0x0d0a20, 0x0d0a20, 0x0d0a20, 0, 0, 0.4, 0.4);
        haze.fillRect(0, HEIGHT - 86, WIDTH, 86);

        return { clouds: clouds, far: far, hills: hills };
    }

    function drawPanel(scene, x, y, width, height, depth) {
        var graphics = scene.add.graphics().setDepth(depth);
        graphics.fillStyle(0x070611, 0.95);
        graphics.fillRect(x - width / 2 + 7, y - height / 2 + 7, width, height);
        graphics.fillStyle(0x0b0a18, 1);
        graphics.fillRect(x - width / 2, y - height / 2, width, height);
        graphics.fillStyle(0x1d1a36, 1);
        graphics.fillRect(x - width / 2 + 6, y - height / 2 + 6, width - 12, height - 12);
        graphics.fillStyle(0x2a2550, 1);
        graphics.fillRect(x - width / 2 + 6, y - height / 2 + 6, width - 12, 4);
        graphics.lineStyle(2, 0x4a4275, 1);
        graphics.strokeRect(
            x - width / 2 + 10,
            y - height / 2 + 10,
            width - 20,
            height - 20
        );
        return graphics;
    }

    function addButton(scene, x, y, width, height, label, options) {
        options = options || {};
        var depth = options.depth === undefined ? 10 : options.depth;
        var palette = options.variant === "secondary"
            ? { base: 0x37325f, light: 0x5a518f, dark: 0x211d3f, text: "#f7f1e3" }
            : { base: 0xe8763a, light: 0xffb070, dark: 0xa7441f, text: "#141222" };

        var container = scene.add.container(x, y).setDepth(depth);
        var graphics = scene.add.graphics();
        var labelText = scene.add.text(0, 1, label, {
            fontFamily: FONT,
            fontSize: (options.fontSize || 16) + "px",
            color: palette.text,
            resolution: 2
        }).setOrigin(0.5);
        container.add([graphics, labelText]);

        var pressed = false;

        function draw(isPressed) {
            graphics.clear();
            graphics.fillStyle(0x080711, 0.9);
            graphics.fillRect(-width / 2 + 5, -height / 2 + 5, width, height);
            graphics.fillStyle(0x080711, 1);
            graphics.fillRect(-width / 2, -height / 2, width, height);
            graphics.fillStyle(isPressed ? palette.dark : palette.base, 1);
            graphics.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
            graphics.fillStyle(isPressed ? palette.base : palette.light, 1);
            graphics.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, 4);
            graphics.fillStyle(palette.dark, 1);
            graphics.fillRect(-width / 2 + 4, height / 2 - 8, width - 8, 4);
        }

        draw(false);

        var zone = scene.add.zone(x, y, width + 10, height + 10)
            .setInteractive({ useHandCursor: true })
            .setDepth(depth + 1);

        zone.on("pointerover", function () {
            if (pressed) {
                return;
            }
            scene.tweens.add({
                targets: container,
                scaleX: 1.03,
                scaleY: 1.03,
                duration: 80,
                ease: "Quad.easeOut"
            });
        });

        zone.on("pointerout", function () {
            pressed = false;
            draw(false);
            scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 80,
                ease: "Quad.easeOut"
            });
        });

        zone.on("pointerdown", function () {
            pressed = true;
            draw(true);
            container.setScale(0.97);
        });

        zone.on("pointerup", function () {
            if (!pressed) {
                return;
            }
            pressed = false;
            container.setScale(1);
            draw(false);
            if (options.onClick) {
                options.onClick();
            }
        });

        return { container: container, zone: zone, label: labelText };
    }

    function addIconButton(scene, x, y, textureKey, onClick, depth) {
        depth = depth === undefined ? 10 : depth;
        var panel = scene.add.rectangle(x, y, 38, 38, 0x0b0918, 0.55)
            .setStrokeStyle(2, 0x463c72, 1)
            .setDepth(depth);
        var icon = scene.add.image(x, y, textureKey)
            .setScale(2)
            .setDepth(depth + 1);
        var zone = scene.add.zone(x, y, 48, 48)
            .setInteractive({ useHandCursor: true })
            .setDepth(depth + 2);
        zone.on("pointerover", function () {
            panel.setFillStyle(0x1d1936, 0.8);
        });
        zone.on("pointerout", function () {
            panel.setFillStyle(0x0b0918, 0.55);
        });
        zone.on("pointerup", onClick);
        return { panel: panel, icon: icon, zone: zone };
    }

    function MenuScene() {
        Phaser.Scene.call(this, { key: "Menu" });
    }

    MenuScene.prototype = Object.create(Phaser.Scene.prototype);
    MenuScene.prototype.constructor = MenuScene;

    MenuScene.prototype.create = function () {
        var self = this;
        this.leaving = false;
        this.best = readBest();
        this.anims.resumeAll();
        PixelArt.generate(this);
        this.backdrop = buildBackdrop(this);

        var eyebrow = text(this, WIDTH / 2, 104, "A N O T H E R", 20, "#b9a9e3", {
            stroke: "#0a0817",
            strokeThickness: 6
        }).setOrigin(0.5);

        var title = text(this, WIDTH / 2, 158, "RUNNER", 58, "#f07b3f", {
            stroke: "#0a0817",
            strokeThickness: 12
        }).setOrigin(0.5);
        title.setShadow(0, 6, "#0a0817", 0, true, true);

        var subtitle = text(this, WIDTH / 2, 214, "PULE · COLETE · SOBREVIVA", 10, "#c9bee8")
            .setOrigin(0.5);

        this.add.sprite(300, 214, "coin-0").setScale(1.5).setAlpha(0.9).play("coin-spin");
        this.add.sprite(660, 214, "coin-0").setScale(1.5).setAlpha(0.9).play("coin-spin");

        // mini cenário do menu
        this.add.tileSprite(WIDTH / 2, 376, 300, PLATFORM_HEIGHT, "ground").setDepth(4);
        this.add.rectangle(WIDTH / 2, 397, 320, 8, 0x0b0a18, 0.3).setDepth(3);
        this.add.rectangle(424, 362, 46, 6, 0x0b0a18, 0.3).setDepth(5);

        var hero = this.add.sprite(424, 327, "hero-idle").setScale(PLAYER_SCALE).setDepth(6);
        hero.play("hero-run");

        [500, 540, 580].forEach(function (x, index) {
            var coin = self.add.sprite(x, 306, "coin-0").setScale(2).setDepth(6);
            coin.play("coin-spin");
            self.tweens.add({
                targets: coin,
                y: 296,
                duration: 850,
                yoyo: true,
                repeat: -1,
                delay: index * 150,
                ease: "Sine.easeInOut"
            });
        });

        this.startButton = addButton(this, WIDTH / 2, 440, 280, 58, "COMEÇAR", {
            fontSize: 18,
            depth: 10,
            onClick: function () {
                self.startGame();
            }
        });

        text(this, WIDTH / 2, 500, "ESPAÇO / ↑ / TOQUE", 9, "#9a8fc0").setOrigin(0.5);
        text(this, WIDTH / 2, 526, "ARTE PIXEL ORIGINAL · CC0", 7, "#6d6394").setOrigin(0.5);

        this.bestLabel = text(this, 24, 22, "RECORDE " + this.best, 10, "#b9aee0")
            .setOrigin(0, 0);

        var muted = audio.isMuted();
        this.soundButton = addIconButton(
            this,
            930,
            32,
            muted ? "icon-sound-off" : "icon-sound-on",
            function () {
                self.toggleSound();
            },
            10
        );

        var start = function (event) {
            if (event && event.repeat) {
                return;
            }
            self.startGame();
        };
        this.input.keyboard.on("keydown-SPACE", start);
        this.input.keyboard.on("keydown-ENTER", start);
        this.input.keyboard.on("keydown-UP", start);
        this.input.keyboard.on("keydown-W", start);
        this.input.keyboard.on("keydown-M", function () {
            self.toggleSound();
        });

        this.cameras.main.fadeIn(240, 10, 8, 26);
    };

    MenuScene.prototype.toggleSound = function () {
        audio.init();
        var muted = audio.toggleMute();
        this.soundButton.icon.setTexture(muted ? "icon-sound-off" : "icon-sound-on");
        if (!muted) {
            audio.click();
        }
    };

    MenuScene.prototype.startGame = function () {
        if (this.leaving) {
            return;
        }
        this.leaving = true;
        audio.init();
        audio.startMusic();
        audio.click();
        var self = this;
        this.cameras.main.fadeOut(180, 10, 8, 26);
        this.cameras.main.once("camerafadeoutcomplete", function () {
            self.scene.start("Game");
        });
    };

    MenuScene.prototype.update = function (time, delta) {
        var dt = Math.min(delta, 50);
        this.backdrop.clouds.tilePositionX += dt * 0.006;
        this.backdrop.far.tilePositionX += dt * 0.009;
        this.backdrop.hills.tilePositionX += dt * 0.022;
    };

    function GameScene() {
        Phaser.Scene.call(this, { key: "Game" });
    }

    GameScene.prototype = Object.create(Phaser.Scene.prototype);
    GameScene.prototype.constructor = GameScene;

    GameScene.prototype.create = function () {
        PixelArt.generate(this);
        this.physics.world.resume();
        this.anims.resumeAll();

        this.isPaused = false;
        this.isOver = false;
        this.best = readBest();
        this.meters = 0;
        this.coinCount = 0;
        this.speed = BASE_SPEED;
        this.grounded = false;
        this.jumpsLeft = 0;
        this.lastGroundAt = -9999;
        this.jumpRequested = false;
        this.jumpRequestedAt = 0;
        this.displayedScore = -1;
        this.displayedCoins = -1;
        this.beatRecord = false;
        this.pauseObjects = null;

        this.backdrop = buildBackdrop(this);
        this.buildWorld();
        this.buildPlayer();
        this.buildHud();
        this.buildInput();
        this.spawnStart();

        this.cameras.main.fadeIn(220, 10, 8, 26);
        audio.startMusic();
    };

    GameScene.prototype.buildWorld = function () {
        this.platforms = this.add.group();
        this.platformPool = [];
        this.coinGroup = this.add.group();
        this.coinPool = [];
    };

    GameScene.prototype.buildPlayer = function () {
        var spawnY = PLATFORM_TOP - (22 * PLAYER_SCALE) / 2;
        this.player = this.physics.add.sprite(PLAYER_X, spawnY, "hero-idle");
        this.player.setScale(PLAYER_SCALE).setDepth(10);
        this.player.body.setSize(10, 19, false);
        this.player.body.setOffset(3, 3);
        this.player.body.setGravityY(GRAVITY);
        this.player.body.setMaxVelocity(0, 1200);
        this.player.body.checkCollision.left = false;
        this.player.body.checkCollision.right = false;
        this.player.play("hero-fall");

        this.physics.add.collider(
            this.player,
            this.platforms,
            this.handleLand,
            this.canLand,
            this
        );
        this.physics.add.overlap(
            this.player,
            this.coinGroup,
            this.handleCoin,
            null,
            this
        );
    };

    GameScene.prototype.buildHud = function () {
        var self = this;
        var shade = this.add.graphics().setDepth(40);
        shade.fillGradientStyle(0x0b0a18, 0x0b0a18, 0x0b0a18, 0x0b0a18, 0.68, 0.68, 0, 0);
        shade.fillRect(0, 0, WIDTH, 92);

        this.scoreText = text(this, 24, 16, "0", 24, "#f7f1e3").setDepth(42);
        this.scoreText.setShadow(2, 2, "#000000", 0, true, true);

        this.bestText = text(this, 24, 52, "RECORDE " + this.best, 10, "#b4a9d6")
            .setDepth(42);

        this.add.image(448, 34, "coin-0").setScale(2).setDepth(42);
        this.coinText = text(this, 466, 26, "0", 14, "#ffe08a").setDepth(42);

        this.soundButton = addIconButton(
            this,
            870,
            32,
            audio.isMuted() ? "icon-sound-off" : "icon-sound-on",
            function () {
                audio.init();
                var muted = audio.toggleMute();
                self.soundButton.icon.setTexture(muted ? "icon-sound-off" : "icon-sound-on");
                if (!muted) {
                    audio.click();
                }
            },
            44
        );

        this.pauseButton = addIconButton(
            this,
            922,
            32,
            "icon-pause",
            function () {
                self.togglePause();
            },
            44
        );
    };

    GameScene.prototype.buildInput = function () {
        var self = this;

        this.jumpZone = this.add.zone(WIDTH / 2, HEIGHT / 2 + 40, WIDTH, HEIGHT - 80)
            .setInteractive();
        this.jumpZone.on("pointerdown", function () {
            self.requestJump();
        });

        var onAction = function (event) {
            if (event && event.repeat) {
                return;
            }
            self.onAction();
        };

        this.input.keyboard.on("keydown-SPACE", onAction);
        this.input.keyboard.on("keydown-UP", onAction);
        this.input.keyboard.on("keydown-W", onAction);

        this.input.keyboard.on("keydown-ESC", function () {
            self.togglePause();
        });
        this.input.keyboard.on("keydown-P", function () {
            self.togglePause();
        });
        this.input.keyboard.on("keydown-R", function () {
            if (self.isOver) {
                self.restartGame();
            }
        });
        this.input.keyboard.on("keydown-M", function () {
            audio.init();
            var muted = audio.toggleMute();
            self.soundButton.icon.setTexture(muted ? "icon-sound-off" : "icon-sound-on");
            if (!muted) {
                audio.click();
            }
        });
    };

    GameScene.prototype.onAction = function () {
        if (this.isPaused) {
            return;
        }
        if (this.isOver) {
            if (this.time.now - this.overAt > 450) {
                this.restartGame();
            }
            return;
        }
        this.requestJump();
    };

    GameScene.prototype.requestJump = function () {
        if (this.isPaused || this.isOver) {
            return;
        }
        audio.init();
        this.jumpRequested = true;
        this.jumpRequestedAt = this.time.now;
    };

    GameScene.prototype.update = function (time, delta) {
        if (this.isPaused || this.isOver) {
            return;
        }

        var dt = Math.min(delta, 50) / 1000;
        this.speed = Math.min(MAX_SPEED, BASE_SPEED + this.meters * 0.06);
        this.meters += this.speed * dt * 0.055;

        this.updateBackdrop(delta);
        this.updatePlayer(time);
        this.updateWorld();
        this.updateSpawner();
        this.updateHud();

        if (this.player.y > HEIGHT + 60) {
            this.finishRun();
        }
    };

    GameScene.prototype.updateBackdrop = function (delta) {
        var factor = this.speed / BASE_SPEED;
        this.backdrop.clouds.tilePositionX += delta * 0.012 * factor;
        this.backdrop.far.tilePositionX += delta * 0.02 * factor;
        this.backdrop.hills.tilePositionX += delta * 0.06 * factor;
    };

    GameScene.prototype.updatePlayer = function (time) {
        var body = this.player.body;
        var touchingGround = body.touching.down || body.blocked.down;

        if (touchingGround) {
            this.grounded = true;
            this.lastGroundAt = time;
            this.jumpsLeft = 2;
        } else if (this.grounded) {
            this.grounded = false;
        }

        if (this.jumpRequested) {
            if (time - this.jumpRequestedAt > JUMP_BUFFER_MS) {
                this.jumpRequested = false;
            } else {
                this.tryJump(time);
            }
        }

        if (this.grounded) {
            this.player.play("hero-run", true);
        } else if (body.velocity.y < 0) {
            this.player.play("hero-jump", true);
        } else {
            this.player.play("hero-fall", true);
        }

        // O corredor é fixo na horizontal. Fixar a posição (e não só a
        // velocidade) evita que uma plataforma em movimento o arraste.
        // Importante: mexe só no eixo X; o Y continua 100% com a física.
        var body = this.player.body;
        var bodyX = PLAYER_X + this.player.scaleX * (body.offset.x - this.player.displayOriginX);
        this.player.x = PLAYER_X;
        body.position.x = bodyX;
        body.prev.x = bodyX;
        body.updateCenter();
        body.velocity.x = 0;
    };

    GameScene.prototype.tryJump = function (time) {
        var inCoyoteTime = time - this.lastGroundAt <= COYOTE_MS;

        if (this.grounded || inCoyoteTime) {
            this.player.setVelocityY(JUMP_FORCE);
            this.grounded = false;
            this.jumpsLeft = 1;
            this.lastGroundAt = -9999;
            this.jumpRequested = false;
            audio.jump();
            this.dustBurst(this.player.x, this.player.y + 30, 4);
        } else if (this.jumpsLeft > 0) {
            this.player.setVelocityY(DOUBLE_JUMP_FORCE);
            this.jumpsLeft -= 1;
            this.jumpRequested = false;
            audio.doubleJump();
            this.sparkle(this.player.x, this.player.y + 24, 5, 0x9fe8df);
        } else {
            this.jumpRequested = false;
        }
    };

    GameScene.prototype.canLand = function (player, platform) {
        if (!platform.active) {
            return false;
        }
        var body = player.body;
        if (body.velocity.y < 0) {
            return false;
        }
        var previousBottom = body.prev.y + body.height;
        return previousBottom <= platform.body.top + 12;
    };

    GameScene.prototype.handleLand = function (player, platform) {
        if (!this.grounded) {
            this.dustBurst(player.x, player.y + 30, 6);
            audio.land();
        }
        this.grounded = true;
        this.lastGroundAt = this.time.now;
        this.jumpsLeft = 2;
    };

    GameScene.prototype.handleCoin = function (player, coin) {
        if (!coin.active || this.isOver) {
            return;
        }
        this.sparkle(coin.x, coin.y, 6, 0xffe08a);
        audio.coin();
        this.coinCount += 1;
        this.recycleCoin(coin);
    };

    GameScene.prototype.updateWorld = function () {
        var self = this;
        var speed = this.speed;

        this.platforms.getChildren().forEach(function (platform) {
            if (!platform.active) {
                return;
            }
            if (platform.x + platform.width / 2 < -80) {
                self.recyclePlatform(platform);
                return;
            }
            platform.body.setVelocityX(-speed);
        });

        this.coinGroup.getChildren().forEach(function (coin) {
            if (!coin.active) {
                return;
            }
            if (coin.x < -50) {
                self.recycleCoin(coin);
                return;
            }
            coin.body.setVelocityX(-speed);
        });
    };

    GameScene.prototype.updateSpawner = function () {
        var maxRight = -Infinity;
        this.platforms.getChildren().forEach(function (platform) {
            if (platform.active) {
                maxRight = Math.max(maxRight, platform.x + platform.width / 2);
            }
        });
        if (maxRight === -Infinity) {
            maxRight = WIDTH;
        }
        while (maxRight < WIDTH + 520) {
            maxRight = this.spawnNextPlatform(maxRight);
        }
    };

    GameScene.prototype.spawnNextPlatform = function (fromRight) {
        var progress = Phaser.Math.Clamp(
            (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED),
            0,
            1
        );
        var minGap = Math.round(84 + progress * 26);
        var maxGap = Math.round(148 + progress * 84);
        var gap = Phaser.Math.Between(minGap, maxGap);
        var minWidth = 120;
        var maxWidth = Math.max(minWidth + 20, Math.round(240 - progress * 60));
        var width = Phaser.Math.Between(minWidth, maxWidth);
        var centerX = fromRight + gap + width / 2;

        this.spawnPlatform(centerX, width);
        if (Math.random() < 0.72) {
            this.spawnCoinArc(centerX);
        }
        return centerX + width / 2;
    };

    GameScene.prototype.spawnStart = function () {
        this.spawnPlatform(420, 980);
        this.spawnCoin(548, 350);
        this.spawnCoin(584, 332);
        this.spawnCoin(620, 350);
        this.updateSpawner();
    };

    GameScene.prototype.spawnPlatform = function (x, width) {
        var y = PLATFORM_TOP + PLATFORM_HEIGHT / 2;
        var platform = this.platformPool.pop();

        if (!platform) {
            platform = this.add.tileSprite(x, y, width, PLATFORM_HEIGHT, "ground")
                .setDepth(5);
            this.physics.add.existing(platform);
            this.platforms.add(platform);
        } else {
            platform.setActive(true).setVisible(true);
            platform.body.enable = true;
            platform.setPosition(x, y);
            platform.setSize(width, PLATFORM_HEIGHT);
        }

        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
        platform.body.setSize(width, PLATFORM_HEIGHT, true);
        platform.body.reset(x, y);
        platform.body.setVelocityX(-this.speed);
    };

    GameScene.prototype.recyclePlatform = function (platform) {
        platform.setActive(false).setVisible(false);
        platform.body.enable = false;
        platform.body.stop();
        this.platformPool.push(platform);
    };

    GameScene.prototype.spawnCoinArc = function (centerX) {
        var count = Phaser.Math.Between(3, 5);
        var spacing = 28;
        var startX = centerX - ((count - 1) * spacing) / 2;

        for (var i = 0; i < count; i++) {
            var arc = Math.sin((i / (count - 1)) * Math.PI) * 20;
            this.spawnCoin(startX + i * spacing, 352 - arc);
        }
    };

    GameScene.prototype.spawnCoin = function (x, y) {
        var coin = this.coinPool.pop();

        if (!coin) {
            coin = this.physics.add.sprite(x, y, "coin-0").setDepth(6);
            this.coinGroup.add(coin);
        } else {
            coin.setActive(true).setVisible(true);
            coin.body.enable = true;
            coin.setPosition(x, y);
        }

        coin.setScale(2);
        coin.body.setAllowGravity(false);
        coin.body.setSize(8, 8, true);
        coin.body.reset(x, y);
        coin.body.setVelocityX(-this.speed);
        coin.play("coin-spin");
    };

    GameScene.prototype.recycleCoin = function (coin) {
        coin.setActive(false).setVisible(false);
        coin.anims.stop();
        coin.body.enable = false;
        coin.body.stop();
        this.coinPool.push(coin);
    };

    GameScene.prototype.getScore = function () {
        return Math.floor(this.meters) + this.coinCount * 25;
    };

    GameScene.prototype.updateHud = function () {
        var score = this.getScore();
        if (score !== this.displayedScore) {
            this.displayedScore = score;
            this.scoreText.setText(String(score));
        }
        if (this.coinCount !== this.displayedCoins) {
            this.displayedCoins = this.coinCount;
            this.coinText.setText(String(this.coinCount));
        }
        if (!this.beatRecord && score > this.best) {
            this.beatRecord = true;
            this.bestText.setText("NOVO RECORDE!");
            this.bestText.setColor("#ffd166");
        }
    };

    GameScene.prototype.dustBurst = function (x, y, count) {
        for (var i = 0; i < count; i++) {
            var dust = this.add.image(
                x + Phaser.Math.Between(-14, 14),
                y + Phaser.Math.Between(-4, 4),
                "dust"
            )
                .setDepth(12)
                .setScale(Phaser.Math.FloatBetween(0.7, 1.5))
                .setAlpha(0.85);
            this.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(-34, -8),
                y: dust.y - Phaser.Math.Between(4, 22),
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: Phaser.Math.Between(240, 440),
                ease: "Quad.easeOut",
                onComplete: function () {
                    dust.destroy();
                }
            });
        }
    };

    GameScene.prototype.sparkle = function (x, y, count, color) {
        for (var i = 0; i < count; i++) {
            var spark = this.add.image(x, y, "spark")
                .setTint(color)
                .setDepth(12)
                .setScale(Phaser.Math.FloatBetween(0.9, 1.6));
            var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            var distance = Phaser.Math.Between(18, 42);
            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 8,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: Phaser.Math.Between(260, 440),
                ease: "Quad.easeOut",
                onComplete: function () {
                    spark.destroy();
                }
            });
        }
    };

    GameScene.prototype.finishRun = function () {
        if (this.isOver) {
            return;
        }
        this.isOver = true;
        this.overAt = this.time.now;
        this.jumpRequested = false;
        this.physics.world.pause();
        this.anims.pauseAll();
        this.player.setTexture("hero-hit");
        this.player.anims.stop();
        this.cameras.main.shake(220, 0.006);
        audio.gameOver();

        var score = this.getScore();
        var isRecord = score > this.best;
        if (isRecord) {
            this.best = score;
            writeBest(score);
            this.bestText.setText("RECORDE " + this.best);
        }

        this.showGameOver(score, isRecord);

        if (isRecord) {
            var self = this;
            this.time.delayedCall(650, function () {
                audio.record();
            });
        }
    };

    GameScene.prototype.showGameOver = function (score, isRecord) {
        var self = this;
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x080711, 0.72)
            .setDepth(1000)
            .setInteractive();
        drawPanel(this, WIDTH / 2, 270, 470, 350, 1001);

        text(this, WIDTH / 2, 136, "FIM DE JOGO", 24, "#f07b3f")
            .setOrigin(0.5)
            .setDepth(1002);
        text(this, WIDTH / 2, 176, "PONTOS", 9, "#a99ed0")
            .setOrigin(0.5)
            .setDepth(1002);
        text(this, WIDTH / 2, 212, String(score), 32, "#f7f1e3")
            .setOrigin(0.5)
            .setDepth(1002);

        this.add.image(440, 254, "coin-0").setScale(1.6).setDepth(1002);
        text(this, 458, 247, "× " + this.coinCount, 14, "#ffe08a")
            .setOrigin(0, 0)
            .setDepth(1002);

        if (isRecord) {
            text(this, WIDTH / 2, 286, "NOVO RECORDE!", 12, "#ffd166")
                .setOrigin(0.5)
                .setDepth(1002);
        } else {
            text(this, WIDTH / 2, 286, "RECORDE " + this.best, 10, "#a99ed0")
                .setOrigin(0.5)
                .setDepth(1002);
        }

        addButton(this, WIDTH / 2, 336, 270, 54, "JOGAR DE NOVO", {
            fontSize: 16,
            depth: 1002,
            onClick: function () {
                self.restartGame();
            }
        });
        addButton(this, WIDTH / 2, 392, 170, 38, "MENU", {
            fontSize: 12,
            variant: "secondary",
            depth: 1002,
            onClick: function () {
                self.goToMenu();
            }
        });

        text(this, WIDTH / 2, 426, "ESPAÇO / R PARA REPETIR", 8, "#7c72a3")
            .setOrigin(0.5)
            .setDepth(1002);
    };

    GameScene.prototype.togglePause = function () {
        if (this.isOver) {
            return;
        }
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    };

    GameScene.prototype.pauseGame = function () {
        if (this.isPaused) {
            return;
        }
        this.isPaused = true;
        this.jumpRequested = false;
        this.physics.world.pause();
        this.anims.pauseAll();
        audio.pause();

        var self = this;
        this.pauseObjects = [];

        var dim = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x080711, 0.7)
            .setDepth(1000)
            .setInteractive();
        this.pauseObjects.push(dim);
        this.pauseObjects.push(drawPanel(this, WIDTH / 2, 270, 400, 260, 1001));
        this.pauseObjects.push(
            text(this, WIDTH / 2, 180, "PAUSADO", 24, "#f7f1e3").setOrigin(0.5).setDepth(1002)
        );
        this.pauseObjects.push(
            text(this, WIDTH / 2, 218, "RESPIRE. O CHÃO ESPERA.", 8, "#a99ed0")
                .setOrigin(0.5)
                .setDepth(1002)
        );

        var resumeButton = addButton(this, WIDTH / 2, 276, 220, 50, "CONTINUAR", {
            fontSize: 14,
            depth: 1002,
            onClick: function () {
                self.resumeGame();
            }
        });
        this.pauseObjects.push(resumeButton.container, resumeButton.zone);

        var menuButton = addButton(this, WIDTH / 2, 338, 170, 38, "MENU", {
            fontSize: 12,
            variant: "secondary",
            depth: 1002,
            onClick: function () {
                self.goToMenu();
            }
        });
        this.pauseObjects.push(menuButton.container, menuButton.zone);

        this.pauseObjects.push(
            text(this, WIDTH / 2, 378, "ESC / P", 8, "#7c72a3").setOrigin(0.5).setDepth(1002)
        );
    };

    GameScene.prototype.resumeGame = function () {
        if (!this.isPaused) {
            return;
        }
        this.isPaused = false;
        if (this.pauseObjects) {
            this.pauseObjects.forEach(function (object) {
                object.destroy();
            });
            this.pauseObjects = null;
        }
        this.physics.world.resume();
        this.anims.resumeAll();
        audio.resume();
    };

    GameScene.prototype.restartGame = function () {
        this.scene.restart();
    };

    GameScene.prototype.goToMenu = function () {
        this.physics.world.resume();
        this.anims.resumeAll();
        if (this.pauseObjects) {
            this.pauseObjects.forEach(function (object) {
                object.destroy();
            });
            this.pauseObjects = null;
        }
        this.isPaused = false;
        this.scene.start("Menu");
    };

    var config = {
        type: Phaser.AUTO,
        parent: "game",
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: "#0d0a20",
        pixelArt: true,
        roundPixels: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        audio: {
            noAudio: true
        },
        scene: [MenuScene, GameScene]
    };

    function showFatal() {
        var fatal = document.getElementById("fatal");
        if (fatal) {
            fatal.hidden = false;
        }
        var loading = document.getElementById("loading");
        if (loading) {
            loading.classList.add("is-hidden");
        }
    }

    function boot() {
        if (!window.Phaser) {
            showFatal();
            return;
        }
        try {
            window.anotherRunnerGame = new Phaser.Game(config);
            document.body.classList.add("is-ready");
            var loading = document.getElementById("loading");
            if (loading) {
                loading.classList.add("is-hidden");
            }
        } catch (error) {
            console.error(error);
            showFatal();
        }
    }

    function waitForFont() {
        if (!document.fonts || !document.fonts.load) {
            return Promise.resolve();
        }
        var timeout = new Promise(function (resolve) {
            window.setTimeout(resolve, 1500);
        });
        var loaded = document.fonts.load('16px "Press Start 2P"').catch(function () {
            return null;
        });
        return Promise.race([loaded, timeout]);
    }

    function start() {
        waitForFont().then(function () {
            window.requestAnimationFrame(boot);
        });
    }

    var rotateHint = document.getElementById("rotate-hint");
    var continueAnyway = document.getElementById("continue-anyway");
    if (rotateHint && continueAnyway) {
        continueAnyway.addEventListener("click", function () {
            rotateHint.classList.add("is-dismissed");
        });
    }

    if (document.readyState === "complete") {
        start();
    } else {
        window.addEventListener("load", start);
    }
})();
