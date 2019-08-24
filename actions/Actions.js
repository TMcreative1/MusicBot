const youtube = require('ytdl-core');
const utils = require('../utils/Utils.js');
const queue = new Map();

async function execute(message) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voiceChannel;
    const serverQueue = queue.get(message.guild.id);

    if (!voiceChannel)
        return message.channel.sendMessage('You need to be in a voice channel to play music!');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.sendMessage('I need the permissions to join and speak in your voice channel!');
    }

    let songInfo = {};
    let song = {};

    try {
        songInfo = await youtube.getInfo(args[1]);
        song = {
            title: songInfo.title,
            url: songInfo.video_url
        };
    } catch (err) {
        return message.channel.sendMessage('Something goes wrong, try to put link from youtube!')
    }


    message.channel.sendMessage(`${song.title} ${song.url}`);

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(message.guild.id, queueContruct);
        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            message.delete(5);
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.sendMessage(err);
        }

    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.sendMessage(`${song.title} has been added to the queue!`);
    }
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(youtube(song.url))
        .on('end', () => {
            console.log('Music ended!');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        })
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);
}

function skip(message) {
    const serverQueue = queue.get(message.guild.id);
    if (!message.member.voiceChannel)
        return message.channel.sendMessage('You have to be in a voice channel to stop the music!');
    if (!serverQueue)
        return message.channel.sendMessage('There is no song that I could skip!');
    serverQueue.connection.dispatcher.end();
}

function stop(message) {
    if (utils.isEmpty(queue)) {
        message.channel.sendMessage('No one song in the queue!');
        return;
    }

    const serverQueue = queue.get(message.guild.id);
    if (!message.member.voiceChannel)
        return message.channel.sendMessage('You have to be in a voice channel to stop the music!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function showQueue(message) {
    if (utils.isEmpty(queue)) {
        message.channel.sendMessage('Queue is empty!');
        return;
    }

    if (!message.member.voiceChannel)
        return message.channel.sendMessage('You have to be in a voice channel to see the queue!');

    return message.channel.sendMessage(utils.getConcatenateValueFromMap(queue));
}

function pause(message) {
    if (utils.isEmpty(queue)) {
        message.channel.sendMessage('Queue is empty!');
        return;
    }

    if (!message.member.voiceChannel)
        return message.channel.sendMessage('You have to be in a voice channel to see the queue!');

    const serverQueue = queue.get(queue.keys().next().value);
    serverQueue.connection.dispatcher.pause();
    return message.channel.sendMessage('Music was paused');
}

function resume(message) {
    if (utils.isEmpty(queue)) {
        message.channel.sendMessage('Queue is empty!');
        return;
    }

    if (!message.member.voiceChannel)
        return message.channel.sendMessage('You have to be in a voice channel to see the queue!');

    const serverQueue = queue.get(queue.keys().next().value);
    serverQueue.connection.dispatcher.resume();
    return message.channel.sendMessage('Music was resumed');
}

module.exports = {
    execute: execute,
    skip: skip,
    pause: pause,
    resume: resume,
    queue: showQueue,
    stop: stop
};
