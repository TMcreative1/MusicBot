const discord = require('discord.js');
const bot = new discord.Client();
const commands = require('./commands/CommandList.js');
const actions = require('./actions/Actions.js');

const config = require('./config/BotConfig.json');
const utils = require("./utils/Utils.js")
const token = process.env.token;
const prefix = config.prefix;

bot.once('ready', () => {
    console.log('Ready!');
})
bot.once('reconnecting', () => {
    console.log('Reconnecting!');
})
bot.once('disconnect', () => {
    console.log('Disconnect!');
})

bot.on('message', async message => {
    if(message.author === bot.user) return;
    
    if (!message.content.startsWith(prefix)) return;

    let command = utils.getCommandFromMessage(message);

    switch (command) {
        case `${prefix}play`:
            await actions.execute(message);
            break;
        case `${prefix}skip`:
            actions.skip(message);
            break;
        case `${prefix}pause`:
            actions.pause(message);
            break;
        case `${prefix}resume`:
            actions.resume(message);
            break;
        case `${prefix}stop`:
            actions.stop(message)
            break;
        case `${prefix}queue`:
            actions.queue(message);
            break;
        case `${prefix}delete`:
            await actions.deleteMessages(message);
            break;
        case `${prefix}help`:
            commands(message);
            break;
        default:
            message.channel.sendMessage(`Sorry, unknown command, use !help for list of commands`);
    }

});

bot.login(token);
