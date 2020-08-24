const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const discordClient = new discord.Client();

const generateMessage = (event) => {
  console.log(event);
};

discordClient.on('message', async (event) => {
  try {
    if (
      // BOT自身のメッセージはスルー
      event.author.username != 'Mr.Wombat'
      && !event.author.bot
      // 自前のサーバーのチャンネルのID
      && event.channel.id == process.env.DISCORD_CHANNEL_ID
    ) {
      const message = generateMessage(event);
      await lineClient.pushMessage(
        // 自前のグループのID
        process.env.LINE_GROUP_ID,
        { type: 'text', text: `(${event.author.username})\n${event.content}` }
      );
    }
  } catch(error) {
    console.error(error);
  } 
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
