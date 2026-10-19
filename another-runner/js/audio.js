/*
 * Another Runner — áudio sintetizado com WebAudio.
 * Música e efeitos são gerados em tempo real; nenhum arquivo de áudio é usado.
 */
(function () {
    "use strict";

    var STORAGE_KEY = "another-runner:muted";

    function readMuted() {
        try {
            return localStorage.getItem(STORAGE_KEY) === "1";
        } catch (error) {
            return false;
        }
    }

    function writeMuted(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
        } catch (error) {
            /* localStorage pode não estar disponível */
        }
    }

    function midiToFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function GameAudio() {
        this.ctx = null;
        this.master = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.noiseBuffer = null;
        this.muted = readMuted();
        this.musicPlaying = false;
        this.musicTimer = null;
        this.step = 0;
        this.nextNoteAt = 0;
        this.stepDuration = 60 / 116 / 2; // colcheias a 116 BPM
        this.bassNotes = [45, 41, 48, 43];
        this.leadNotes = [
            69, 0, 72, 0, 76, 0, 72, 0,
            65, 0, 69, 0, 72, 0, 69, 0,
            72, 0, 76, 0, 79, 0, 76, 0,
            67, 0, 71, 0, 74, 0, 71, 0
        ];
        this.bindVisibility();
    }

    GameAudio.prototype.bindVisibility = function () {
        var self = this;
        document.addEventListener("visibilitychange", function () {
            if (!self.ctx) {
                return;
            }
            if (document.hidden) {
                self.ctx.suspend().catch(function () { });
            } else {
                self.ctx.resume().catch(function () { });
                self.nextNoteAt = self.ctx.currentTime + 0.05;
            }
        });
    };

    GameAudio.prototype.init = function () {
        if (this.ctx) {
            if (this.ctx.state === "suspended") {
                this.ctx.resume().catch(function () { });
            }
            return;
        }
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.2;
        this.musicGain.connect(this.master);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.55;
        this.sfxGain.connect(this.master);

        this.noiseBuffer = this.createNoiseBuffer();
    };

    GameAudio.prototype.createNoiseBuffer = function () {
        var length = Math.floor(this.ctx.sampleRate * 0.12);
        var buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    };

    GameAudio.prototype.isMuted = function () {
        return this.muted;
    };

    GameAudio.prototype.toggleMute = function () {
        this.muted = !this.muted;
        writeMuted(this.muted);
        if (this.master && this.ctx) {
            this.master.gain.setTargetAtTime(
                this.muted ? 0 : 1,
                this.ctx.currentTime,
                0.02
            );
        }
        return this.muted;
    };

    GameAudio.prototype.startMusic = function () {
        this.init();
        if (!this.ctx || this.musicPlaying) {
            return;
        }
        this.musicPlaying = true;
        this.step = 0;
        this.nextNoteAt = this.ctx.currentTime + 0.1;
        var self = this;
        this.musicTimer = window.setInterval(function () {
            self.scheduleMusic();
        }, 90);
        this.scheduleMusic();
    };

    GameAudio.prototype.scheduleMusic = function () {
        if (!this.ctx || !this.musicPlaying) {
            return;
        }
        var now = this.ctx.currentTime;
        // se a aba ficou parada, não tenta "recuperar" o tempo perdido
        if (this.nextNoteAt < now - 0.5) {
            this.nextNoteAt = now + 0.05;
        }
        while (this.nextNoteAt < now + 0.25) {
            this.playMusicStep(this.step, this.nextNoteAt);
            this.step = (this.step + 1) % 32;
            this.nextNoteAt += this.stepDuration;
        }
    };

    GameAudio.prototype.playMusicStep = function (step, when) {
        var chord = Math.floor(step / 8);
        if (step % 4 === 0) {
            this.note(this.bassNotes[chord], when, 0.42, "triangle", 0.24, this.musicGain);
        }
        var lead = this.leadNotes[step];
        if (lead) {
            this.note(lead, when, 0.2, "square", 0.075, this.musicGain);
        }
        if (step % 2 === 0) {
            this.hat(when);
        }
    };

    GameAudio.prototype.note = function (midi, when, duration, type, volume, destination) {
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(midiToFrequency(midi), when);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(when);
        osc.stop(when + duration + 0.03);
    };

    GameAudio.prototype.hat = function (when) {
        var source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        var filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 6200;
        var gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02, when);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        source.start(when);
        source.stop(when + 0.05);
    };

    GameAudio.prototype.slide = function (from, to, duration, type, volume) {
        if (!this.ctx || this.muted) {
            return;
        }
        var when = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(from, when);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + duration);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(volume, when + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(when);
        osc.stop(when + duration + 0.03);
    };

    GameAudio.prototype.blip = function (frequency, delay, duration, volume) {
        if (!this.ctx || this.muted) {
            return;
        }
        var when = this.ctx.currentTime + delay;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(frequency, when);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(volume, when + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(when);
        osc.stop(when + duration + 0.03);
    };

    GameAudio.prototype.jump = function () {
        this.slide(300, 560, 0.11, "square", 0.16);
    };

    GameAudio.prototype.doubleJump = function () {
        this.slide(520, 940, 0.12, "square", 0.14);
    };

    GameAudio.prototype.land = function () {
        this.slide(130, 70, 0.08, "sine", 0.18);
    };

    GameAudio.prototype.coin = function () {
        this.blip(1046, 0, 0.07, 0.13);
        this.blip(1568, 0.06, 0.1, 0.12);
    };

    GameAudio.prototype.click = function () {
        this.slide(680, 520, 0.05, "square", 0.1);
    };

    GameAudio.prototype.pause = function () {
        this.blip(440, 0, 0.08, 0.1);
    };

    GameAudio.prototype.resume = function () {
        this.blip(660, 0, 0.08, 0.1);
    };

    GameAudio.prototype.gameOver = function () {
        var notes = [392, 330, 262, 196];
        for (var i = 0; i < notes.length; i++) {
            this.blip(notes[i], i * 0.13, 0.16, 0.14);
        }
    };

    GameAudio.prototype.record = function () {
        var notes = [523, 659, 784, 1046];
        for (var i = 0; i < notes.length; i++) {
            this.blip(notes[i], i * 0.1, 0.16, 0.12);
        }
    };

    window.AnotherRunnerAudio = new GameAudio();
})();
