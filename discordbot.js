const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const discordClient = new discord.Client();

const generateMessage = (event) => {
  const content = event.content;
  if (content.length === 0 || !content) {
    return {
      type: 'text',
      text: `Discordで非対応の形式のメッセージを送信しました。`,
      sender: {
        name: event.author.username,
        iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
      },
    };
  }
  return {
    type: 'text',
    text: `${content}`,
    sender: {
      name: event.author.username,
      iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
    },
  };
};

discordClient.on('message', async (event) => {
  try {
    if (
      // BOT自身のメッセージはスルー
      !event.author.bot
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
