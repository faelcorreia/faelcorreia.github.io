/*
 * Another Runner — pixel art gerada em runtime.
 * Tudo aqui é desenho original, feito pixel a pixel no canvas.
 * Sem imagens externas, sem fotos, sem assets de terceiros.
 */
(function () {
    "use strict";

    var HERO_COLORS = {
        o: "#141222", // contorno
        h: "#2f807a", // capuz
        H: "#1f5b58", // capuz (sombra)
        s: "#f2c89a", // pele
        S: "#d9a271", // pele (sombra)
        w: "#ffffff", // olho
        x: "#141222", // olho "morto"
        r: "#f07b3f", // cachecol
        R: "#c14f24", // cachecol (sombra)
        j: "#3d9c93", // jaqueta
        J: "#2a6f6a", // jaqueta (sombra)
        p: "#333d5c", // calça
        b: "#1b1826" // bota
    };

    var ICON_COLORS = {
        w: "#f7f1e3",
        r: "#f07b3f",
        k: "#141222"
    };

    // Cabeça e tronco (16 x 16). As pernas variam por frame.
    var HERO_TOP = [
        "................",
        "......oooo......",
        ".....ohhhho.....",
        "....ohhhhhho....",
        "....ohhhhhho....",
        "....ohssssho....",
        "....ohswswho....",
        "....ohsssso.....",
        ".....oRrrRo.....",
        "...oohjjjjhoo...",
        "...ohjjjjjjho...",
        "..soojjjjjjooS..",
        "..soojjjjjjooS..",
        "....ojjjjjjo....",
        "....opppppo.....",
        "....opppppo....."
    ];

    var LEGS_IDLE = [
        "....opppppo.....",
        "....oppppo......",
        "....oppoppo.....",
        "....obbo.obbo...",
        "....obbo.obbo...",
        "....oo...oo....."
    ];

    var LEGS_RUN_A = [
        "....opppppo.....",
        "...oppo.oppo....",
        "..oppo...oppo...",
        "..obbo...obbo...",
        "..obo.....obo...",
        "..oo.......oo..."
    ];

    var LEGS_RUN_B = [
        "....opppppo.....",
        "....oppo.oppo...",
        "...oppo...oppo..",
        "...obbo...obbo..",
        "...obo.....obo..",
        "...oo.......oo.."
    ];

    var LEGS_JUMP = [
        "....opppppo.....",
        "...oppppppo.....",
        "..oppo...oppo...",
        "..obbo...obbo...",
        "...obo...obo....",
        "...oo.....oo...."
    ];

    var COIN_ROWS = [3, 5, 7, 7, 7, 7, 5, 3];

    function addCanvas(scene, key, width, height, draw) {
        if (scene.textures.exists(key)) {
            return;
        }
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        draw(ctx, width, height);
        scene.textures.addCanvas(key, canvas);
    }

    function drawRows(ctx, rows, colors) {
        for (var y = 0; y < rows.length; y++) {
            var row = rows[y];
            for (var x = 0; x < row.length; x++) {
                var color = colors[row.charAt(x)];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    function seeded(seed) {
        var state = seed >>> 0;
        return function () {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function heroFrame(legs, deadEyes) {
        var top = HERO_TOP.slice();
        if (deadEyes) {
            top[6] = "....ohsxsxho....";
        }
        return top.concat(legs);
    }

    function drawCoin(ctx, frame) {
        var scales = [1, 0.72, 0.42, 0.15, 0.42, 0.72];
        var scale = scales[frame];
        ctx.clearRect(0, 0, 12, 12);
        for (var i = 0; i < COIN_ROWS.length; i++) {
            var w = Math.max(1, Math.round(COIN_ROWS[i] * scale));
            var x = Math.round(6 - w / 2);
            var y = 2 + i;
            ctx.fillStyle = "#a35a1d";
            ctx.fillRect(x, y, w, 1);
            if (w >= 3) {
                ctx.fillStyle = frame === 0 || frame === 5 ? "#f6c945" : "#d99a2b";
                ctx.fillRect(x + 1, y, w - 2, 1);
            }
            if (w >= 5) {
                ctx.fillStyle = "#ffe9a3";
                ctx.fillRect(x + 1, y, 1, 1);
            }
        }
        if (frame === 0 || frame === 5) {
            ctx.fillStyle = "#fff6cf";
            ctx.fillRect(9, 1, 1, 1);
        }
    }

    function drawGround(ctx) {
        var rand = seeded(7);
        var x;
        for (x = 0; x < 16; x++) {
            ctx.fillStyle = "#79d17f";
            ctx.fillRect(x, 0, 1, 1);
            ctx.fillStyle = "#4eae67";
            ctx.fillRect(x, 1, 1, 2);
            ctx.fillStyle = "#2f7a4d";
            ctx.fillRect(x, 3, 1, 1);
            ctx.fillStyle = "#6a4a34";
            ctx.fillRect(x, 4, 1, 28);
        }
        for (x = 0; x < 16; x += 3) {
            ctx.fillStyle = "#a4eaa0";
            ctx.fillRect(x, 0, 1, 1);
            ctx.fillStyle = "#3a8f56";
            ctx.fillRect((x + 1) % 16, 2, 1, 2);
        }
        for (var i = 0; i < 28; i++) {
            var px = Math.floor(rand() * 16);
            var py = 6 + Math.floor(rand() * 24);
            ctx.fillStyle = rand() > 0.5 ? "#54382a" : "#7d5a40";
            ctx.fillRect(px, py, 1, 1);
        }
        // faixas horizontais bem discretas, para dar volume
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        ctx.fillRect(0, 11, 16, 1);
        ctx.fillRect(0, 20, 16, 1);
        ctx.fillStyle = "#3b251b";
        ctx.fillRect(0, 31, 16, 1);
    }

    function drawCloud(ctx, cx, cy, scale) {
        var blocks = [
            [0, 8, 34, 6, 0.5],
            [8, 4, 22, 8, 0.68],
            [16, 0, 14, 6, 0.78],
            [26, 6, 18, 7, 0.62],
            [4, 12, 40, 4, 0.46]
        ];
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i];
            ctx.globalAlpha = b[4];
            ctx.fillStyle = "#b7a9db";
            ctx.fillRect(
                Math.round(cx + b[0] * scale),
                Math.round(cy + b[1] * scale),
                Math.round(b[2] * scale),
                Math.round(b[3] * scale)
            );
        }
        ctx.globalAlpha = 1;
    }

    function drawClouds(ctx, width) {
        var rand = seeded(21);
        for (var i = 0; i < 4; i++) {
            var cx = 44 + i * 116 + Math.floor(rand() * 34);
            var cy = 22 + Math.floor(rand() * 78);
            var scale = 0.7 + rand() * 0.65;
            // desenha também fora da borda para o tile emendar sem costura
            drawCloud(ctx, cx - width, cy, scale);
            drawCloud(ctx, cx, cy, scale);
            drawCloud(ctx, cx + width, cy, scale);
        }
    }

    function drawSky(ctx, width, height) {
        var gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#0d0a20");
        gradient.addColorStop(0.45, "#281a44");
        gradient.addColorStop(0.72, "#68395c");
        gradient.addColorStop(1, "#c06a5f");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        var rand = seeded(4);
        for (var i = 0; i < 110; i++) {
            var x = Math.floor(rand() * width);
            var y = Math.floor(rand() * 300);
            var size = rand() > 0.86 ? 2 : 1;
            ctx.globalAlpha = 0.25 + rand() * 0.7;
            ctx.fillStyle = ["#ffffff", "#cbb9ff", "#ffe9b0"][Math.floor(rand() * 3)];
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;

        // sol pixelado, quase encostando nas montanhas
        var cx = 724;
        var cy = 292;
        var radius = 44;
        var block = 4;
        for (var by = -radius; by <= radius; by += block) {
            for (var bx = -radius; bx <= radius; bx += block) {
                var distance = Math.sqrt(
                    (bx + block / 2) * (bx + block / 2) +
                    (by + block / 2) * (by + block / 2)
                );
                if (distance <= radius) {
                    ctx.fillStyle = distance <= radius - 14 ? "#ffe6a6" : "#f7c873";
                    ctx.globalAlpha = distance <= radius - 14 ? 0.95 : 0.75;
                    ctx.fillRect(cx + bx, cy + by, block, block);
                }
            }
        }
        ctx.globalAlpha = 1;

        // passarinhos
        ctx.fillStyle = "#1a1430";
        ctx.fillRect(176, 122, 2, 2);
        ctx.fillRect(179, 119, 2, 2);
        ctx.fillRect(182, 122, 2, 2);
        ctx.fillRect(214, 148, 2, 2);
        ctx.fillRect(217, 145, 2, 2);
        ctx.fillRect(220, 148, 2, 2);
    }

    function drawMountains(ctx, width, height) {
        function ridge(color, base, amp1, amp2, phase, freq1, freq2) {
            for (var x = 0; x < width; x++) {
                var h =
                    base +
                    amp1 * Math.sin((2 * Math.PI * x) / (width / freq1) + phase) +
                    amp2 * Math.sin((2 * Math.PI * x) / (width / freq2) + phase * 1.7);
                var y = Math.round(height - h);
                if (y < 62) {
                    ctx.fillStyle = "#715a96";
                    ctx.fillRect(x, y, 1, 2);
                }
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, height - y);
            }
        }
        ridge("#543c77", 86, 38, 16, 0.6, 2, 4);
        ridge("#3b2a58", 52, 30, 12, 2.2, 3, 5);
    }

    function drawPine(ctx, x, baseY, size) {
        ctx.fillStyle = "#152a36";
        for (var i = 0; i < 3; i++) {
            var treeWidth = Math.round(size * (1 - i * 0.22));
            var top = baseY - size + Math.round(i * size * 0.27);
            var rows = Math.max(2, Math.round(size * 0.22));
            for (var row = 0; row < rows; row++) {
                var rowWidth = Math.round((treeWidth * (row + 1)) / rows);
                ctx.fillRect(x - Math.floor(rowWidth / 2), top + row, rowWidth, 1);
            }
        }
        ctx.fillRect(x - 1, baseY - 3, 2, 3);
    }

    function drawHills(ctx, width, height) {
        var treeSpots = [24, 72, 120, 190, 260, 330, 400, 455];
        function hillHeight(x) {
            return (
                34 +
                20 * Math.sin((2 * Math.PI * x) / 240 + 1.1) +
                10 * Math.sin((2 * Math.PI * x) / 120 + 0.3)
            );
        }
        for (var x = 0; x < width; x++) {
            var y = Math.round(height - hillHeight(x));
            ctx.fillStyle = "#22394a";
            ctx.fillRect(x, y, 1, height - y);
        }
        for (var i = 0; i < treeSpots.length; i++) {
            var tx = treeSpots[i];
            var baseY = Math.round(height - hillHeight(tx)) + 4;
            drawPine(ctx, tx, baseY, 20 + (i % 3) * 7);
        }
    }

    function drawIcon(ctx, rows) {
        drawRows(ctx, rows, ICON_COLORS);
    }

    function createAnimations(scene) {
        if (!scene.anims.exists("hero-run")) {
            scene.anims.create({
                key: "hero-run",
                frames: [
                    { key: "hero-run-a" },
                    { key: "hero-idle" },
                    { key: "hero-run-b" },
                    { key: "hero-idle" }
                ],
                frameRate: 12,
                repeat: -1
            });
        }
        if (!scene.anims.exists("hero-jump")) {
            scene.anims.create({
                key: "hero-jump",
                frames: [{ key: "hero-jump" }],
                frameRate: 1
            });
        }
        if (!scene.anims.exists("hero-fall")) {
            scene.anims.create({
                key: "hero-fall",
                frames: [{ key: "hero-fall" }],
                frameRate: 1
            });
        }
        if (!scene.anims.exists("hero-hit")) {
            scene.anims.create({
                key: "hero-hit",
                frames: [{ key: "hero-hit" }],
                frameRate: 1
            });
        }
        if (!scene.anims.exists("coin-spin")) {
            scene.anims.create({
                key: "coin-spin",
                frames: [
                    { key: "coin-0" },
                    { key: "coin-1" },
                    { key: "coin-2" },
                    { key: "coin-3" },
                    { key: "coin-4" },
                    { key: "coin-5" }
                ],
                frameRate: 12,
                repeat: -1
            });
        }
    }

    function generate(scene) {
        addCanvas(scene, "sky", 960, 540, drawSky);
        addCanvas(scene, "clouds", 480, 140, function (ctx, w) {
            drawClouds(ctx, w);
        });
        addCanvas(scene, "mountains", 480, 220, drawMountains);
        addCanvas(scene, "hills", 480, 140, drawHills);
        addCanvas(scene, "ground", 16, 32, drawGround);

        addCanvas(scene, "hero-idle", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_IDLE), HERO_COLORS);
        });
        addCanvas(scene, "hero-run-a", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_RUN_A), HERO_COLORS);
        });
        addCanvas(scene, "hero-run-b", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_RUN_B), HERO_COLORS);
        });
        addCanvas(scene, "hero-jump", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_JUMP), HERO_COLORS);
        });
        addCanvas(scene, "hero-fall", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_RUN_A), HERO_COLORS);
        });
        addCanvas(scene, "hero-hit", 16, 22, function (ctx) {
            drawRows(ctx, heroFrame(LEGS_IDLE, true), HERO_COLORS);
        });

        for (var i = 0; i < 6; i++) {
            (function (frame) {
                addCanvas(scene, "coin-" + frame, 12, 12, function (ctx) {
                    drawCoin(ctx, frame);
                });
            })(i);
        }

        addCanvas(scene, "dust", 4, 4, function (ctx) {
            ctx.fillStyle = "#e9ddc5";
            ctx.fillRect(1, 1, 2, 2);
        });
        addCanvas(scene, "spark", 5, 5, function (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(2, 0, 1, 5);
            ctx.fillRect(0, 2, 5, 1);
        });

        addCanvas(scene, "icon-sound-on", 12, 12, function (ctx) {
            drawIcon(ctx, [
                "............",
                "...w........",
                "..ww...w....",
                ".www..w.w...",
                ".www.w...w..",
                ".www.w...w..",
                ".www.w...w..",
                ".www..w.w...",
                "..ww...w....",
                "...w........",
                "............",
                "............"
            ]);
        });
        addCanvas(scene, "icon-sound-off", 12, 12, function (ctx) {
            drawIcon(ctx, [
                "............",
                "...w........",
                "..ww...r....",
                ".www..r.r...",
                ".www...r....",
                ".www..r.r...",
                ".www...r....",
                ".www..r.r...",
                "..ww...r....",
                "...w........",
                "............",
                "............"
            ]);
        });
        addCanvas(scene, "icon-pause", 12, 12, function (ctx) {
            drawIcon(ctx, [
                "............",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "..ww....ww..",
                "............",
                "............",
                "............"
            ]);
        });

        createAnimations(scene);
    }

    window.PixelArt = {
        generate: generate
    };
})();
