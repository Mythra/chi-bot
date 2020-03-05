#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();

const CompilerExplorerCommand = require('./command/compiler-explorer.js')
  .command;
const HelpCommand = require('./command/help.js').command;
const MovCommand = require('./command/mov-command.js').command;

const activeCommands = [
  new CompilerExplorerCommand(client),
  new HelpCommand(client),
  new MovCommand(client),
];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on('message', msg => {
  if (msg.author.bot) {
    return;
  }
  for (let idx = 0; idx < activeCommands.length; ++idx) {
    (async () => await activeCommands[idx].onMessage(msg))();
  }
});

client.login(process.env.CHI_BOT_DISCORD_TOKEN);
