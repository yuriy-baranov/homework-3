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
    }
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