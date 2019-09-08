const ytdl = require('ytdl-core');
const utils = require('../utils/Utils.js');
const youtubeApi = require('simple-youtube-api');
const youtube = new youtubeApi(process.env.youtube_api_key);
const queue = new Map();
const youtubePlayListRegex = new RegExp("^.*(youtu.be\\/|list=)([^#\\&\\?]*).*");
const youtubeVideoRegex = new RegExp("^.*(?:(?:youtu\\.be\\/|v\\/|vi\\/|u\\/\\w\\/|embed\\/)|(?:(?:watch)?\\?v(?:i)?=|\\&v(?:i)?=))([^#\\&\\?]*).*");

async function execute(message) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voiceChannel;

    if (!voiceChannel)
        return message.channel.sendMessage('You need to be in a voice channel to play music!');

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.sendMessage('I need the permissions to join and speak in your voice channel!');
    }

    if (message.content.match(youtubePlayListRegex)) {
        try {
            const playListUrl = utils.getMessageContentAfterCommand(message);
            const playList = await youtube.getPlaylist(playListUrl);
            const videos = await playList.getVideos();
            for (let i = 0; i < videos.length; i++) {
                let songInfo = await youtube.getVideoByID(videos[i].id);
                await startPlayOrAddMusicToQueue(message, songInfo, false);
            }
            return;
        } catch (e) {
            console.error(e);
            return await message.channel.sendMessage('Playlist is either private or it does not exist');
        }
    }

    if (message.content.match(youtubeVideoRegex)) {
        try {
            const songInfo = await youtube.getVideoByID(utils.getVideoIdFromUrl(args[1]));
            return await startPlayOrAddMusicToQueue(message, songInfo, true);
        } catch (err) {
            console.error(err);
            return await message.channel.sendMessage('Something goes wrong, try to put link from youtube!')
        }
    }

    try {
        const musicName = utils.getMessageContentAfterCommand(message);
        const searchedResult = await youtube.searchVideos(musicName, 5);
        await message.channel.sendMessage(await utils.getMessageOfSearchedResult(searchedResult));
        try {
            let response = await message.channel.awaitMessages(
                msg => (msg.content > 0 && msg.content < 6) || msg.content === 'exit', {
                    max: 1,
                    maxProcessed: 1,
                    time: 60000,
                    errors: ['time']
                }
            );
            if (response.first().content === 'exit')
                return;
            let videoIndex = parseInt(response.first().content) - 1;
            const songInfo = await youtube.getVideoByID(utils.getVideoIdFromUrl(searchedResult[videoIndex].url));
            return await startPlayOrAddMusicToQueue(message, songInfo, true);
        } catch (e) {
            console.error(e);
            return await message.channel.sendMessage('Please try again and enter a number between 1 and 5 or exit');
        }
    } catch (error) {
        console.error(error);
        return await message.channel.sendMessage('Something goes wrong with searching video that you requested');
    }
}

async function startPlayOrAddMusicToQueue(message, songInfo, isShowAddedToQueue) {
    const serverQueue = queue.get(message.guild.id);
    const voiceChannel = message.member.voiceChannel;
    let song = {
        title : songInfo.title,
        url : songInfo.url,
        duration : utils.getPrettySongDuration(songInfo.duration)
    };

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
            queueContruct.connection = await voiceChannel.join();
            await message.channel.sendMessage(`${song.title} ${song.url}`);
            message.delete(5);
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return await message.channel.sendMessage(err);
        }

    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (isShowAddedToQueue)
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

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            console.log('Music ended!');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        });
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

    const serverQueue = queue.get(message.guild.id);
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

    const serverQueue = queue.get(message.guild.id);
    serverQueue.connection.dispatcher.resume();
    return message.channel.sendMessage('Music was resumed');
}

async function deleteMessages(message) {
    try {
        let deleteCount = parseInt(utils.getMessageContentAfterCommand(message));
        if (!deleteCount || deleteCount < 1 || deleteCount > 100)
            return message.channel.sendMessage('Please provide a number between 1 and 100 for the number of messages to delete')

        message.channel
            .bulkDelete(deleteCount)
            .then(messages => message.channel.sendMessage(`Deleted ${messages.size} messages`))
            .catch(e => {
                console.error(e);
                return message.channel.sendMessage('Something went wrong when trying to delete messages :(');
            })
    } catch (e) {
        console.log(e);
        return await message.channel.sendMessage('Please provide the number of messages to delete. (max 100)');
    }
}

module.exports = {
    execute: execute,
    skip: skip,
    pause: pause,
    resume: resume,
    queue: showQueue,
    stop: stop,
    deleteMessages: deleteMessages
};
