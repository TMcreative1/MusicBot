const youtubeApi = require('simple-youtube-api');
const youtube = new youtubeApi(process.env.youtube_api_key);

function isEmpty(obj) {
    for (let key of obj.keys())
        return false;
    return true;
}

function getConcatenateValueFromMap(map) {
    let result = 'Here is a list of tracks\n';
    for (let value of map.values())
        for (let song of value.songs)
            result += `${song.title} (${song.duration})\n`;

    return result;
}

async function getMessageOfSearchedResult(searchedResult) {
    let message = 'Choose a song by commenting a number between 1 and 5 or exit\n';
    for (let i = 0; i < searchedResult.length; i++) {
        let songInfo = await youtube.getVideoByID(getVideoIdFromUrl(searchedResult[i].url));
        message += `Song ${i + 1} - ${songInfo.title} (${getPrettySongDuration(songInfo.duration)})\n`;
    }

    return message;
}

function getCommandFromMessage(message) {
    if (message.content.indexOf(" ") === -1)
        return message.content;
    return message.content.slice(0, message.content.indexOf(" "));
}

function getMessageContentAfterCommand(message) {
    return message.content.substr(message.content.indexOf(" ") + 1);
}

function getVideoIdFromUrl(url) {
    return url
        .replace(/(>|<)/gi, '')
        .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)[2]
        .split(/[^0-9a-z_\-]/i)[0]
}

function getPrettySongDuration(duration) {
    let result = "";

    if (duration.hours) {
        result += duration.hours < 10 ? `0${duration.hours}:` : `${duration.hours}:`
    }

    if (duration.minutes) {
        result += duration.minutes < 10 ? `0${duration.minutes}:` : `${duration.minutes}:`
    } else {
        result += '00:';
    }

    if (duration.seconds) {
        result += duration.seconds < 10 ? `0${duration.seconds}` : `${duration.seconds}`
    } else {
        result += '00';
    }

    return result;

}

function getMapSize(map) {
    let size = 0;
    for (let value of map.values())
        for (let song of value.songs)
            size++;

    return size
}

module.exports = {
    isEmpty: isEmpty,
    getConcatenateValueFromMap : getConcatenateValueFromMap,
    getMessageOfSearchedResult : getMessageOfSearchedResult,
    getCommandFromMessage: getCommandFromMessage,
    getMessageContentAfterCommand : getMessageContentAfterCommand,
    getVideoIdFromUrl : getVideoIdFromUrl,
    getPrettySongDuration : getPrettySongDuration,
    getMapSize : getMapSize
};
