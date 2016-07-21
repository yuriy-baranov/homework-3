var Player = require('./player.js');
var player = new Player();

var subsInput = document.querySelector('.popup__subs-input');
var applyButton = document.querySelector('.popup__apply-button');


applyButton.addEventListener('click', () => {
    fetch(subsInput.value)
        .then((response) => {
            return response.text()
        })
        .then((text) => {
            player.subtitles = text;
            document.querySelector('.popup').style.visibility = 'hidden';
        });
});