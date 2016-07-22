var Player = require('./player.js');
var player = new Player();

var subsInput = document.querySelector('.popup__subs-input');
var applyButton = document.querySelector('.popup__apply-button');
var videoInput = document.querySelector('.popup__movie-input');
var audioInput = document.querySelector('.popup__audio-input');

applyButton.addEventListener('click', () => {
    player.videoMain.src = videoInput.value;
    player.audioElement.src = audioInput.value;
    fetch(subsInput.value)
        .then((response) => {
            return response.text()
        })
        .then((text) => {
            player.subtitles = text;
            document.querySelector('.popup').style.visibility = 'hidden';
        });
});