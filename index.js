const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};

express()
  // .use(express.static(path.join(__dirname, 'public')))
  // .set('views', path.join(__dirname, 'views'))
  // .set('view engine', 'ejs')
  // .get('/', (req, res) => res.render('pages/index'))
  // .get('/g/', (req, res) => res.json({ method: "get" }))
  // .post('/p/', (req, res) => res.json({ method: "posted" }))
  .post("/linehook/", line.middleware(config), (req, res) => lineBot(req, res))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const lineBot = (req, res) => {
  res.status(200).end();
  const events = req.body.events;
  const promises = [];
  for (const event of events) {
    promises.push(generateText(event));
  }
  Promise.all(promises).then(console.log("pass"));
};

const generateText = async (event) => {
  const pro =  await client.getProfile(ev.source.userId);
  return client.replyMessage(ev.replyToken, {
    type: "text",
    text: `${pro.displayName}\n${ev.message.text}`
  });
};
