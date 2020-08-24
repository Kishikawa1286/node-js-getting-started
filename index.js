const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');
const axios = require('axios');

const PORT = process.env.PORT || 5000;

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const webhookUrl = process.env.DISCORD_WEBHOOK_URL
const webhookConfig = {
  headers: {
    'Accept': 'application/json',
    'Content-type': 'application/json',
  }
};

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/linehook/', line.middleware(lineConfig), (req, res) => lineBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const generatePostData = (event, username) => {
  // 画像 / テキスト / スタンプ / それ以外で分岐させる
  const type = event.message.type;
  switch (type) {
    case "text":
      return {
        username,
        content: event.message.text,
      };
    case "sticker":
      return {
        username,
        content: `${username} send a sticker.`,
      };
    case "image":
      console.log(event.message);
      // return {
      //   username,
      //   embeds: [{
      //     image: {
      //       url: event.message.image,
      //     }
      //   }],
      // };
    case "video":
      console.log(event.message);
      // return {
      //   username,
      //   embeds: [{
      //     url: event.message.url,
      //   }],
      // };
    default:
      return {
        username,
        content: `${username} send a message except sticker and text.`,
      };
  }
};

const lineBot = async (req, res) => {
  res.status(200).end(); // 'status 200'をまず送信

  const events = req.body.events;
  events.forEach(async (event) => {
    try {
      const profile =  await lineClient.getProfile(event.source.userId);

      const postData = generatePostData(event, profile.displayName);
      // DiscordのWebHookにPOSTする
      await axios.post(webhookUrl, postData, webhookConfig);
    } catch(error) {
      console.error(error);
    }
  });
};
