/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Player = __webpack_require__(1);
	var player = new Player();

	var subsInput = document.querySelector('.popup__subs-input');
	var applyButton = document.querySelector('.popup__apply-button');

	applyButton.addEventListener('click', function () {
	    fetch(subsInput.value).then(function (response) {
	        return response.text();
	    }).then(function (text) {
	        player.subtitles = text;
	        document.querySelector('.popup').style.visibility = 'hidden';
	    });
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var makeGrayScale = __webpack_require__(2);
	var parse = __webpack_require__(3);

	var Player = function () {
	    function Player() {
	        _classCallCheck(this, Player);

	        this.block = document.querySelector('.player');
	        this.canvas = document.querySelector('.player__canvas');
	        this.webglCanvas = document.querySelector('.player__webgl-canvas');
	        this.videoMain = document.querySelector('.video-main');
	        this.videoEffect = document.querySelector('.video-effect');
	        this.timeLine = document.querySelector('.controls__time-line');
	        this.timeLineProgress = document.querySelector('.time-line__progress');
	        this.playButton = document.querySelector('.controls__play-button');
	        this.sound = document.querySelector('.video-soundtrack');

	        this.videoMain.addEventListener('loadeddata', this.initCanvas.bind(this));
	        this.videoMain.addEventListener('canplay', this.renderFrame.bind(this));
	        this.playButton.addEventListener('click', this.onPlayButtonToggle.bind(this));
	        this.timeLine.addEventListener('click', this.onTimeLineClick.bind(this));

	        this.timer = 0;
	        this.status = { eventType: 'video', play: false };
	        this.subs = [];
	        this.subsFullDuration = 0;
	        this.canvasContext = this.canvas.getContext('2d');
	        this.grainyEffect = document.getElementById('grainy');
	        this.videoMain.volume = 0;
	        this.initSound();
	    }

	    _createClass(Player, [{
	        key: 'mainLoop',
	        value: function mainLoop() {
	            this.updateTime();
	            this.updateCurrentEvent();
	            if (this.status.play) {
	                this.renderFrame();
	            }
	            requestAnimationFrame(this.mainLoop.bind(this));
	        }
	    }, {
	        key: 'renderFrame',
	        value: function renderFrame() {
	            if (this.status.eventType === 'video') {
	                this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
	                this.canvasContext.drawImage(this.videoMain, 0, 0);
	                makeGrayScale();
	                this.canvasContext.drawImage(this.webglCanvas, 0, 0, this.canvas.width, this.canvas.height);
	            } else {
	                this.showSubs();
	            }
	            this.imposeOldEffect();
	        }
	    }, {
	        key: 'updateTime',
	        value: function updateTime() {
	            if (this.status.play) {
	                var curTime = new Date();
	                this.timer += (curTime - this.timeStart) / 1000;
	                this.timeStart = curTime;
	            }
	            this.timeLineProgress.style.width = this.timer / (this.videoMain.duration + this.subsFullDuration) * 100 + '%';
	        }
	    }, {
	        key: 'updateCurrentEvent',
	        value: function updateCurrentEvent() {
	            var changedStatus = this.getEventByTime(this.timer);
	            if (this.status.eventType === 'video' && changedStatus.eventType === 'subs') {
	                this.videoMain.pause();
	            }
	            if (this.status.eventType === 'subs' && changedStatus.eventType === 'video' && this.status.play) {
	                this.videoMain.play();
	            }
	            this.status = changedStatus;
	        }
	    }, {
	        key: 'getEventByTime',
	        value: function getEventByTime(time) {
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
	    }, {
	        key: 'showSubs',
	        value: function showSubs() {
	            var _this = this;

	            this.canvasContext.fillStyle = 'black';
	            this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
	            this.canvasContext.font = '40px Oranienbaum';
	            this.canvasContext.textAlign = 'center';
	            this.canvasContext.fillStyle = 'white';
	            var curHeight = 0;
	            this.subs[this.status.subIndex].content.forEach(function (str) {
	                _this.canvasContext.fillText(str, _this.canvas.width / 2, _this.canvas.height / 2 + curHeight);
	                curHeight += 45;
	            });
	        }
	    }, {
	        key: 'imposeOldEffect',
	        value: function imposeOldEffect() {
	            this.canvasContext.globalAlpha = 0.5;
	            this.canvasContext.drawImage(this.videoEffect, 0, 0, this.canvas.width, this.canvas.height);
	            this.canvasContext.globalAlpha = 1;
	        }
	    }, {
	        key: 'initCanvas',
	        value: function initCanvas() {
	            var width = this.videoMain.videoWidth;
	            var height = this.videoMain.videoHeight;
	            this.canvas.width = width;
	            this.canvas.height = height;
	            this.webglCanvas.width = width;
	            this.webglCanvas.height = height;
	            this.block.style.width = 900 + 'px';
	            this.block.style.height = height / width * 900 + 'px';
	            this.mainLoop();
	        }
	    }, {
	        key: 'onPlayButtonToggle',
	        value: function onPlayButtonToggle() {
	            if (this.status.play) {
	                this.pause();
	                this.playButton.classList.add('controls__play-button_used');
	            } else {
	                this.play();
	                this.playButton.classList.remove('controls__play-button_used');
	            }
	        }
	    }, {
	        key: 'play',
	        value: function play() {
	            this.updateTime();
	            this.timeStart = new Date();
	            this.status.play = true;
	            this.noizeGain.connect(this.audioContext.destination);
	            if (this.status.eventType === 'video') {
	                this.videoMain.play();
	            }
	            this.videoEffect.play();
	            this.sound.play();
	        }
	    }, {
	        key: 'pause',
	        value: function pause() {
	            this.updateTime();
	            this.status.play = false;
	            this.noizeGain.disconnect();
	            if (this.status.eventType === 'video') {
	                this.videoMain.pause();
	            }
	            this.videoEffect.pause();
	            this.sound.pause();
	        }
	    }, {
	        key: 'onTimeLineClick',
	        value: function onTimeLineClick(e) {
	            var timeLinePosX = this.timeLine.getBoundingClientRect().left;
	            var timeLineWidth = this.timeLine.offsetWidth;
	            this.timer = (e.clientX - timeLinePosX) / timeLineWidth * (this.videoMain.duration + this.subsFullDuration);
	            var changedStatus = this.getEventByTime(this.timer);
	            this.videoMain.currentTime = changedStatus.videoTime;
	            this.updateCurrentEvent();
	            this.sound.currentTime = this.timer % this.sound.duration;
	        }
	    }, {
	        key: 'initSound',
	        value: function initSound() {
	            this.audioContext = new AudioContext();
	            var audioCtx = this.audioContext;
	            var destination = audioCtx.destination;
	            var source = audioCtx.createMediaElementSource(this.sound);
	            var biquadFilter = audioCtx.createBiquadFilter();
	            biquadFilter.type = "highpass";
	            biquadFilter.frequency.value = 900;
	            biquadFilter.gain.value = 6;
	            source.connect(biquadFilter);
	            biquadFilter.connect(destination);

	            var bufferSize = 4096;
	            var pinkNoise = function () {
	                var b0, b1, b2, b3, b4, b5, b6;
	                b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
	                var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
	                node.onaudioprocess = function (e) {
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
	                };
	                return node;
	            }();

	            this.noizeGain = audioCtx.createGain();
	            pinkNoise.connect(this.noizeGain);
	            this.noizeGain.gain.value = 0.1;
	        }
	    }, {
	        key: 'subtitles',
	        set: function set(subs) {
	            this.subs = parse(subs);
	            var curSubsTime = 0;
	            this.subs.forEach(function (sub, index) {
	                sub.duration = sub.end - sub.start;
	                sub.realStart = sub.end + curSubsTime;
	                sub.realEnd = sub.realStart + sub.duration;
	                curSubsTime += sub.duration;
	            }, this);
	            this.subsFullDuration = curSubsTime;
	        }
	    }]);

	    return Player;
	}();

	module.exports = Player;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	var webglCanvas, canvas, webglContext;

	function postprocessWebGL(canvas, gl, sourceCanvas) {
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
	    gl.viewport(0, 0, canvas.width, canvas.height);
	    gl.enable(gl.DEPTH_TEST);
	    gl.clear(gl.COLOR_BUFFER_BIT);
	    gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	function prepareWebGL(canvas, gl, sourceCanvas) {
	    var program = gl.createProgram();

	    var vertexCode = '\n        attribute vec2 coordinates;\n        attribute vec2 texture_coordinates;\n        varying vec2 v_texcoord;\n        void main() {\n          gl_Position = vec4(coordinates,0.0, 1.0);\n          v_texcoord = texture_coordinates;\n        }\n        ';

	    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	    gl.shaderSource(vertexShader, vertexCode);
	    gl.compileShader(vertexShader);

	    var fragmentCode = ' \n        precision mediump float;\n        varying vec2 v_texcoord;\n        uniform sampler2D u_texture;\n        uniform float u_time;\n        float grayScaleAt(vec2 point) {\n            return (0.3 * texture2D(u_texture, point).r) + (0.59 * texture2D(u_texture, point).g) + (0.11 * texture2D(u_texture, point).b);\n        }\n        float random(float x, float y, float color) {\n            return abs(fract(sin(dot(vec2(x + y, color + y) ,vec2(12.9898,78.233))) * 43758.5453));\n        }\n        void main() {\n            float x = v_texcoord.x;\n            float y = v_texcoord.y;\n            float color = grayScaleAt(v_texcoord);\n            float newColor = 0.0;\n            float prev = 0.0;\n            for (int i = 0; i < 5; i++) {\n                float dx = (random(x, y, prev) - 0.5) / 100.0;\n                float dy = (random(x, y, prev) - 0.5) / 100.0;\n                newColor += grayScaleAt(vec2(x + dx, y + dy));\n                prev = dx * dy;\n            }\n            newColor = newColor / 5.0;\n            \n            // если полученный цвет сильно отличается от исходного, то он сглаживается\n            if (abs(newColor / color) > 1.25) {\n                newColor = (newColor + color) / 2.0;\n            }\n            gl_FragColor = vec4(newColor, newColor, newColor, 1.0);\n        }\n        ';

	    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	    gl.shaderSource(fragmentShader, fragmentCode);
	    gl.compileShader(fragmentShader);

	    gl.attachShader(program, vertexShader);
	    gl.attachShader(program, fragmentShader);

	    gl.linkProgram(program);
	    gl.useProgram(program);

	    var positionLocation = gl.getAttribLocation(program, 'coordinates');
	    var texcoordLocation = gl.getAttribLocation(program, 'texture_coordinates');

	    var buffer = gl.createBuffer();
	    var vertices = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
	    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	    gl.enableVertexAttribArray(positionLocation);
	    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	    buffer = gl.createBuffer();
	    var textureCoordinates = [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0];
	    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	    gl.enableVertexAttribArray(texcoordLocation);
	    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

	    var texture = gl.createTexture();
	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}

	function makeGrayScale() {
	    postprocessWebGL(webglCanvas, webglContext, canvas);
	}

	function init() {
	    webglCanvas = document.querySelector('.player__webgl-canvas');
	    canvas = document.querySelector('.player__canvas');
	    webglContext = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl');
	    prepareWebGL(webglCanvas, webglContext, canvas);
	}

	init();

	module.exports = makeGrayScale;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	function decodeTimeMoment(str) {
	    var h = parseInt(str.substr(0, 2));
	    var m = parseInt(str.substr(3, 2));
	    var s = parseInt(str.substr(6, 2));
	    var ms = parseInt(str.substr(9, 3));
	    return h * 3600 + m * 60 + s + ms / 1000;
	}

	function decodeTimePeriod(s, result) {
	    var encodedStartTime = s.substr(0, 12);
	    var encodedEndTime = s.substr(17, 12);
	    return {
	        start: decodeTimeMoment(encodedStartTime),
	        end: decodeTimeMoment(encodedEndTime)
	    };
	}

	function Parse(str) {
	    var ar = str.split('\n');
	    var subs = [];
	    var line = 0;
	    while (line < ar.length) {
	        var s = ar[line];
	        if (s.indexOf('-->') !== -1) {
	            var decodedTimePeriod = decodeTimePeriod(s),
	                sub = {
	                start: decodedTimePeriod.start,
	                end: decodedTimePeriod.end,
	                content: []
	            };
	            line++;
	            while (line !== ar.length && ar[line] !== '') {
	                sub.content.push(ar[line]);
	                line++;
	            }
	            subs.push(sub);
	        }
	        line++;
	    }
	    return subs;
	}

	module.exports = Parse;

/***/ }
/******/ ]);