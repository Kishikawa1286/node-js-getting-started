const express = require('express');
const path = require('path');
const line = require('@line/bot-sdk');
const axios = require('axios');
const fs = require('fs');
const GyazoApi = require('gyazo-api');
const PORT = process.env.PORT || 5000;

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);
const gyazoClient = new GyazoApi(process.env.GYAZO_ACCESS_TOKEN);

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

const getImageFromLineMessage = async (event) => {
  const responseOfGettingImage = await axios.get(
    `https://api.line.me/v2/bot/message/${event.message.id}/content`,
    {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'image/jpg',
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      },
    },
  );

  if (responseOfGettingImage.status !== 200) {
    throw new Error(`Failed to get image. status: ${responseOfGettingImage.status}`);
  }
  console.log('Successfully get image.');
  
  return responseOfGettingImage.data;
};

const uploadImageToGyazo = async (imageDataPath) => {
  const responseOfUploadingImage = await gyazoClient.upload(
    imageDataPath,
    {
      title: 'image',
      desc: 'uploaded from mrwombat',
    },
  );
  console.log('Successfully uploaded image to Gyazo.');
  const gyazoUrl = `${responseOfUploadingImage.data.permalink_url}.jpg`;
  console.log(`permalink: ${gyazoUrl}`);
  return gyazoUrl;
};

const generatePostData = async (event, profile) => {
  // 画像 / テキスト / スタンプ / それ以外で分岐させる
  const type = event.message.type;
  switch (type) {
    case 'text':
      return {
        username: profile.displayName,
        "avatar_url": `${profile.pictureUrl}.png`,
        content: event.message.text,
      };

    case 'sticker':
      return {
        username: profile.displayName,
        "avatar_url": `${profile.pictureUrl}.png`,
        content: `${profile.displayName} used a sticker.`,
      };

    case 'image':
      const imageData = await getImageFromLineMessage(event);
      const encodedImageData = Buffer.from(imageData, 'binary');
      try {
        fs.unlinkSync('./image.jpg'); // 古い image.jpg を消す
      } catch (error) {
        console.log('Tried to delete old image.jpg but it did not exist.');
      }
      fs.writeFileSync('./image.jpg', encodedImageData, 'binary');
      const gyazoPermaLinkUrl = uploadImageToGyazo('./image.jpg');
      return {
        username: profile.displayName,
        "avatar_url": `${profile.pictureUrl}.png`,
        embeds: [{
          image: {
            url: gyazoPermaLinkUrl,
          }
        }],
      };

    default:
      return {
        username: profile.displayName,
        "avatar_url": `${profile.pictureUrl}.png`,
        content: `${profile.displayName} send a message except sticker and text.`,
      };
  }
};

const lineBot = async (req, res) => {
  res.status(200).end(); // 'status 200'をLINEのAPIに送信

  const events = req.body.events;
  events.forEach(async (event) => {
    try {
      const profile =  await lineClient.getProfile(event.source.userId);
      const postData = await generatePostData(event, profile);
      console.log(profile);
      // DiscordのWebHookにPOSTする
      await axios.post(webhookUrl, postData, webhookConfig);
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
};
