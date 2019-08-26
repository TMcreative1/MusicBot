function isEmpty(obj) {
    for (let key of obj.keys())
        return false;
    return true;
}

function getConcatenateValueFromMap(map) {
    let result = 'Here is a list of tracks\n';
    for (let value of map.values())
        for (let song of value.songs)
            result += `${song.title}\n`;

    return result;
}

function getMessageOfSearchedResult(searchedResult) {
    let message = 'Choose a song by commenting a number between 1 and 5 or exit\n';
    for (let i = 0; i < searchedResult.length; i++) {
        message += `Song ${i + 1} - ${searchedResult[i].title}\n`;
    }

    return message;
}

function getMessageContentAfterCommand(message) {
    return message.content.substr(message.content.indexOf(" ") + 1);
}

module.exports = {
    isEmpty: isEmpty,
    getConcatenateValueFromMap : getConcatenateValueFromMap,
    getMessageOfSearchedResult : getMessageOfSearchedResult,
    getMessageContentAfterCommand : getMessageContentAfterCommand
};