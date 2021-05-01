const line = require('@line/bot-sdk');
const discord = require('discord.js');
const axios = require('axios');

const webhookUrl = process.env.DISCORD_WEBHOOK_URL
const webhookConfig = {
  headers: {
    'Accept': 'application/json',
    'Content-type': 'application/json',
  }
};

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
            name: event.author.username,
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
          name: event.author.username,
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
          name: event.author.username,
          iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
        },
      }]
    );
    return imagesWithText;
  }

  console.log(event.author.displayAvatarURL);
  console.log(typeof event.author.displayAvatarURL);
  console.log(event.author.displayAvatarURL().replace('.webp', 'png'));
  
  // テキストのみ
  if (content.length !== 0 && content) {
    return {
      type: 'text',
      text: `${content}`,
      sender: {
        name: event.author.username,
        iconUrl: event.author.displayAvatarURL().replace('.webp', '.png'),
      },
    };
  }
  
  // 例外
  return {
    type: 'text',
    text: `Discordで非対応の形式のメッセージを送信しました。`,
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
    if (newMember.bot) return;
    await axios.post(
      webhookUrl,
      {
        username: "Debug Message",
        content: `${newMember.toJSON()}`,
      },
      webhookConfig
    );
    // await lineClient.pushMessage(
    //   // 自前のグループのID
    //   process.env.LINE_GROUP_ID,
    //   {
    //     type: 'text',
    //     text: `${newMember.client.username}が${newMember.channel}に入室しました。`,
    //     sender: {
    //       name: newMember.client.username,
    //       iconUrl: newMember.client.username.displayAvatarURL().replace('.webp', '.png'),
    //     },
    //   },
    // );
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
