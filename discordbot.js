const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
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
    // BOT自身のメッセージはスルー
    if (!event.author.bot) {
      const message = generateMessage(event);
      await lineClient.pushMessage(
        // 送信先のID
        process.env.LINE_TARGET_ID,
        message,
      );
    }
  } catch(error) {
    console.error(error);
  } 
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
