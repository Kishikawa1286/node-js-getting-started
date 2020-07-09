const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const line = require('@line/bot-sdk');
const { Webhook, MessageBuilder } = require('discord-webhook-node');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const webhook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

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
  const promises = [];
  for (const event of events) {
    const profile =  await lineClient.getProfile(event.source.userId);
    // promises.push(lineClient.pushMessage(
    //   'C00292191febefd43a58ad477709683ea',
    //   { type: 'text', text: `${profile.displayName}\n${event.message.text}` }
    // ));
    const embed = new MessageBuilder()
      .setTitle('Message from LINE group')
      .addField('content', `${profile.displayName}\n${event.message.text}`, true);
    webhook.send(embed);
  }
  Promise.all(promises).then(console.log('All promises were resolved successfully'));
};
