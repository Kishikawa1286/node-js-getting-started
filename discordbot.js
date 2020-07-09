const line = require('@line/bot-sdk');
const discord = require('discord.js');

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_KEY
};
const lineClient = new line.Client(lineConfig);

const discordClient = new discord.Client();

discordClient.on('message', async (event) => {
  if (event.author.username != 'Mr.Wombat') {
    await lineClient.pushMessage(
      'C00292191febefd43a58ad477709683ea',
      { type: 'text', text: `${event.author.username}\n${event.content}` }
    );
  }
});

discordClient.login(process.env.DISCORD_ACCESS_TOKEN);
