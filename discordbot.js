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
  const attachments = Array.from(event.attachments.values());
  // 画像あり
  if (attachments[0]) {
    const images = attachments.map((attachment) => {
      if (attachment.name.match(/.+\.(jpg|png|gif|jpeg)/)) {
        return {
          type: 'image',
          originalContentUrl: attachment.url,
          previewImageUrl: attachment.url,
          sender: {
            name: event.member.displayName,
            iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
          },
        };
      }
      return null;
    }).filter((item) => item !== null);

    if (images.length === 0) {
      return {
        type: 'text',
        text: `Discordで非対応の形式のファイルを送信しました。`,
        sender: {
          name: event.member.displayName,
          iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
        },
      };
    }

    // 画像のみ
    if (content.length === 0 || !content) return images;

    // 画像とテキスト
    const imagesWithText = images.concat(
      [{
        type: 'text',
        text: `${content}`,
        sender: {
          name: event.member.displayName,
          iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
        },
      }]
    );
    return imagesWithText;
  }

  // テキストのみ
  if (content.length !== 0 && content) {
    return {
      type: 'text',
      text: `${content}`,
      sender: {
        name: event.member.displayName,
        iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
      },
    };
  }
  
  // 例外
  return {
    type: 'text',
    text: `Discordで非対応の形式のメッセージを送信しました。`,
    sender: {
      name: event.member.displayName,
      iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
    },
  };
};

discordClient.on('message', async (message) => {
  try {
    if (
      // BOT自身のメッセージはスルー
      !message.author.bot
      // 自前のサーバーのチャンネルのID
      && message.channel.id == process.env.DISCORD_CHANNEL_ID
    ) {
      const msg = generateMessage(message);
      await lineClient.pushMessage(
        // 自前のグループのID
        process.env.LINE_GROUP_ID,
        msg,
      );
    }
  } catch (error) {
    console.error(error);
    try {
      await axios.post(
        webhookUrl,
        {
          username: "Error Message",
          content: `${error}`,
        },
        webhookConfig
      );
    } catch (error) {
      console.error(error);
    }
  } 
});

discordClient.on('voiceStateUpdate', async (oldMember, newMember) => {
  try {
    if (newMember.member.user.bot) return;
    if (oldMember.channel === null && newMember.channel !== null) {
      const channel = await discordClient.channels.fetch(newMember.channelID);
      await lineClient.pushMessage(
        process.env.LINE_GROUP_ID,
        {
          type: 'text',
          text: `${newMember.member.displayName}が${channel.name}に入室しました。\nhttps://discord.gg/fxV4PaNf`,
          sender: {
            name: newMember.member.displayName,
            iconUrl: newMember.member.user.displayAvatarURL().replace('.webp', '.png'),
          },
        },
      );
    }
    if (oldMember.channel !== null && newMember.channel === null) {
      const channel = await discordClient.channels.fetch(oldMember.channelID);
      await lineClient.pushMessage(
        process.env.LINE_GROUP_ID,
        {
          type: 'text',
          text: `${newMember.member.displayName}が${channel.name}から退室しました。`,
          sender: {
            name: newMember.member.displayName,
            iconUrl: newMember.member.user.displayAvatarURL().replace('.webp', '.png'),
          },
        },
      );
    }
  } catch (error) {
    console.error(error);
    try {
      await axios.post(
        webhookUrl,
        {
          username: "Error Message",
          content: `${error}`,
        },
        webhookConfig
      );
    } catch (error) {
      console.error(error);
    }
  }
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
