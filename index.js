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

const lineBot = async (req, res) => {
  res.status(200).end();
  const events = req.body.events;
  for (const event of events) {
    try {
      const profile =  await lineClient.getProfile(event.source.userId);
      const postData = {
        username: profile.displayName,
        content: event.message.text,
      };
      const webhookRes = await axios.post(webhookUrl, postData, webhookConfig);
      console.log(webhookRes);
    } catch(error) {
      console.error(error);
    }
  }
};
