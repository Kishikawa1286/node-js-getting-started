const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const discordClient = new discord.Client();

const generateMessage = (event) => {
  switch (event.type) {
    case 'text':
      return {
        type: 'text',
        text: `(${event.author.username})\n${event.content}`
      };
    case 'DEFAULT':
      const url = event.attachments.attachment;
      console.log(event.attachments);
      console.log(event.attachment);
      // return {
      //   type: 'image',
      //   originalContentUrl: url,
      //   previewImageUrl: url,
      // }
    default:
      return {
        type: 'text',
        text: `Discordで ${event.author.username} が非対応の形式のメッセージを送信しました。`
      };
  }
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
        message,
      );
    }
  } catch(error) {
    console.error(error);
  } 
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
