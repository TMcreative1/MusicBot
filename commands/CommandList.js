let prefix = require('../config/BotConfig.json').prefix;
let commands = [
    `${prefix}play - Play your music`,
    `${prefix}skip - Skip current track`,
    `${prefix}pause - Pause current track`,
    `${prefix}resume - Resume current track`,
    `${prefix}stop - Stop current track`,
    `${prefix}queue - View queue of tracks`,
    `${prefix}help - Show advanced usage of a command`]

let show = function showCommands(message) {
    let commandList = '';
    for (let command of commands)
        commandList += `${command}\n`;
    message.channel.sendMessage(commandList);
}

module.exports = show;