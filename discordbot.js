const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const discordClient = new discord.Client();

discordClient.on('message', async (event) => {
  try {
    if (
      event.author.username != 'Mr.Wombat'
      // 自前のサーバーのチャンネルのID
      && event.channel.id == '720810848003686500'
      && !event.author.bot
    ) {
      await lineClient.pushMessage(
        // 自前のグループのID
        'C00292191febefd43a58ad477709683ea',
        { type: 'text', text: `(${event.author.username})\n${event.content}` }
      );
    }
  } catch(error) {
    console.error(error);
  } 
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
