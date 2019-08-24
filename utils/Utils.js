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

module.exports = {
    isEmpty: isEmpty,
    getConcatenateValueFromMap : getConcatenateValueFromMap
};