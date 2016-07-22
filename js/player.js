var makeGrayScale = require('./grayscale-effect.js');
var parse = require('./subs-parser.js');

class Player {
    constructor() {
        this.block = document.querySelector('.player');
        this.canvas = document.querySelector('.player__canvas');
        this.webglCanvas = document.querySelector('.player__webgl-canvas');
        this.videoMain = document.querySelector('.video-main');
        this.videoEffect = document.querySelector('.video-effect');
        this.timeLine = document.querySelector('.controls__time-line');
        this.timeLineProgress = document.querySelector('.time-line__progress');
        this.controls = document.querySelector('.player__controls');
        this.playButton = document.querySelector('.controls__play-button');
        this.audioElement = document.querySelector('.video-soundtrack');
        this.loadingIcon = document.querySelector('.player__loading-icon');


        this.sources = document.querySelector('.player__sources');
        this.playButton.addEventListener('click', this.onPlayButtonToggle.bind(this));
        this.timeLine.addEventListener('click', this.onTimeLineClick.bind(this));

        this.timer = 0;
        this.status = { eventType: 'video', play: false };
        this.subs = [];
        this.subsFullDuration = 0;
        this.canvasContext = this.canvas.getContext('2d');
        this.videoMain.muted = true;
        this.initSound();

        this.dataLoaded = { videoMain: false, videoEffect: false, videoSoundtrack: false };
        this.sources.addEventListener('canplay', this.checkSourcesLoaded.bind(this), true);
        this.sources.addEventListener('waiting', this.waitLoading.bind(this), true);
    }

    waitLoading(e) {
        this.wasWaiting = true;
        this.dataLoaded[e.target.dataset.type] = false;
        this.controls.style.transform = 'translateY(100px)';
        this.loadingIcon.style.visibility = 'visible';
        if (this.status.play) {
            this.onPlayButtonToggle();
        }
    }

    checkSourcesLoaded(e) {
        this.dataLoaded[e.target.dataset.type] = true;
        if (this.dataLoaded.videoEffect && this.dataLoaded.videoMain && this.dataLoaded.videoSoundtrack) {
            if (this.wasWaiting && !this.status.play) {
                this.onPlayButtonToggle();
            }
            this.initCanvas();
            this.controls.style.transform = 'translateY(0px)';
            this.loadingIcon.style.visibility = 'hidden';
        }
    }

    initCanvas() {
        if (this.canvasInited) {
            return;
        }
        this.canvasInited = true;
        var width = this.videoMain.videoWidth;
        var height = this.videoMain.videoHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.webglCanvas.width = width;
        this.webglCanvas.height = height;
        this.block.style.width = `${900}px`;
        this.block.style.height = `${height / width * 900}px`;
        this.mainLoop();
    }

    mainLoop() {
        this.updateTime();
        this.updateCurrentEvent();
        if (this.status.play) {
            this.renderFrame();
        }
        requestAnimationFrame(this.mainLoop.bind(this));
    }

    renderFrame() {
        if (this.status.eventType === 'video') {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasContext.drawImage(this.videoMain, 0, 0, this.canvas.width, this.canvas.height);
        }
        else {
            this.showSubs();
        }
        makeGrayScale();
        this.canvasContext.drawImage(this.webglCanvas, 0, 0, this.canvas.width, this.canvas.height);
        this.imposeOldEffect();
        
    }

    updateTime() {
        if (this.status.play) {
            var curTime = new Date();
            this.timer += (curTime - this.timeStart) / 1000;  
            this.timeStart = curTime;
        }
        this.timeLineProgress.style.width = `${this.timer / (this.videoMain.duration + this.subsFullDuration) * 100}%`;
    }

    updateCurrentEvent() {
        var changedStatus = this.getEventByTime(this.timer);
        if (this.status.eventType === 'video' && changedStatus.eventType === 'subs') {
            this.videoMain.pause();
        }
        if (this.status.eventType === 'subs' && changedStatus.eventType === 'video' && this.status.play) {
            this.videoMain.play();
        }
        this.status = changedStatus;
    }

    getEventByTime(time) {
        var curSubsTime = 0;
        var subs = this.subs;
        for (var i = 0; i < subs.length; i++) {
            var sub = subs[i];
            if (sub.realStart <= time && time <= sub.realEnd) {
                return { play: this.status.play, eventType: 'subs', subIndex: i, videoTime: sub.end };
            }
            if (sub.realStart > time) {
                return { play: this.status.play, eventType: 'video', videoTime: time - curSubsTime };
            }
            curSubsTime += sub.duration;
        }
        return { play: this.status.play, eventType: 'video', videoTime: time - curSubsTime };
    }

    showSubs() {
        this.canvasContext.fillStyle = 'black';
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext.font = '40px Oranienbaum';
        this.canvasContext.textAlign = 'center';
        this.canvasContext.fillStyle = 'white';
        var curHeight = 0;
        this.subs[this.status.subIndex].content.forEach((str) => {
            this.canvasContext.fillText(str, this.canvas.width / 2, this.canvas.height / 2 + curHeight);
            curHeight += 45;
        });
        
    }

    imposeOldEffect() {
        this.canvasContext.globalAlpha = 0.5;
        this.canvasContext.drawImage(this.videoEffect, 0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext.globalAlpha = 1;
    }

    onPlayButtonToggle() {
        if (this.status.play) {
            this.pause();
            this.playButton.classList.add('controls__play-button_used')
        }
        else {
            this.play();
            this.playButton.classList.remove('controls__play-button_used')
        }
    }

    play() {
        this.updateTime();
        this.timeStart = new Date();
        this.status.play = true;
        this.noizeGain.connect(this.audioContext.destination);
        if (this.status.eventType === 'video') {
            this.videoMain.play();
        }
        this.videoEffect.play();
        this.audioElement.play();
    }

    pause() {
        this.updateTime();
        this.status.play = false;
        this.noizeGain.disconnect();
        if (this.status.eventType === 'video') {
            this.videoMain.pause();
        }
        this.videoEffect.pause();
        this.audioElement.pause();
    }

    onTimeLineClick(e) {
        var timeLinePosX = this.timeLine.getBoundingClientRect().left;
        var timeLineWidth = this.timeLine.offsetWidth;
        this.timer = (e.clientX - timeLinePosX) / timeLineWidth * (this.videoMain.duration + this.subsFullDuration);
        var changedStatus = this.getEventByTime(this.timer);
        this.videoMain.currentTime = changedStatus.videoTime;
        this.updateCurrentEvent();
        this.audioElement.currentTime = this.timer % this.audioElement.duration;
    }

    set subtitles(subs) {
        this.subs = parse(subs);
        var curSubsTime = 0;
        this.subs.forEach((sub, index) => {
            sub.duration = sub.end - sub.start;
            sub.realStart = sub.end + curSubsTime;
            sub.realEnd = sub.realStart + sub.duration;
            curSubsTime += sub.duration;
        }, this);
        this.subsFullDuration = curSubsTime;
    }

    initSound() {
        this.audioContext = new AudioContext();
        var audioCtx = this.audioContext;
        var destination = audioCtx.destination;
        var source = audioCtx.createMediaElementSource(this.audioElement);
        var biquadFilter = audioCtx.createBiquadFilter(); 
        biquadFilter.type = "highpass";
        biquadFilter.frequency.value = 900;
        biquadFilter.gain.value = 6;
        source.connect(biquadFilter);
        biquadFilter.connect(destination);

        var bufferSize = 4096;
        var pinkNoise = (function() {
            var b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
            node.onaudioprocess = function(e) {
                var output = e.outputBuffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) {
                    var white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    output[i] *= 0.11;
                    b6 = white * 0.115926;
                }
            }
            return node;
        })();
        
        this.noizeGain = audioCtx.createGain();
        pinkNoise.connect(this.noizeGain);
        this.noizeGain.gain.value = 0.1;
    }
}

module.exports = Player;