const discord = require('discord.js');
const bot = new discord.Client();
const commands = require('./commands/CommandList.js');
const actions = require('./actions/Actions.js');

let config = require('./config/BotConfig.json');
let token = process.env.token;
let prefix = config.prefix;

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

    if (message.content.startsWith(`${prefix}play`)) {
        actions.execute(message);
    } else if (message.content.startsWith(`${prefix}skip`)) {
        actions.skip(message);
    } else if (message.content.startsWith(`${prefix}pause`)) {
        actions.pause(message);
    } else if (message.content.startsWith(`${prefix}resume`)) {
        actions.resume(message);
    } else if (message.content.startsWith(`${prefix}stop`)) {
        actions.stop(message);
    } else if (message.content.startsWith(`${prefix}queue`)) {
        actions.queue(message);
    } else if (message.content.startsWith(`${prefix}help`)) {
        commands(message);
    } else if (message.content.startsWith(`${prefix}`)) {
        message.channel.sendMessage(`Sorry, unknown command, use !help for list of commands`);
    }

});

bot.login(token);
