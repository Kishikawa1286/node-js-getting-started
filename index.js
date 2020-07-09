const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const line = require("@line/bot-sdk");

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post("/linehook/", line.middleware(lineConfig), (req, res) => lineBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const lineBot = (req, res) => {
  res.status(200).end();
  const events = req.body.events;
  const promises = [];
  for (const event of events) {
    promises.push(generateText(event));
  }
  Promise.all(promises).then(console.log("promises were resolved successfully"));
};

const generateText = async (event) => {
  const profile =  await lineClient.getProfile(event.source.userId);
  console.log(`reply token: ${event.source.groupId}`);
  return lineClient.replyMessage(event.replyToken, {
    type: "text",
    text: `${profile.displayName}\n${event.message.text}`
  });
};
