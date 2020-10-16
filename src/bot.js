#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();

const CompilerExplorerCommand = require('./command/compiler-explorer.js')
  .command;
const HelpCommand = require('./command/help.js').command;
const PingCommand = require('./command/ping-command.js').command;
const QuickBenchCommand = require('./command/quick-bench.js').command;
const UwuCommand = require('./command/uwu-command.js').command;

let activeCommands;
if (process.env.MINIMAL == '1') {
  activeCommands = [
    new CompilerExplorerCommand(client),
    new HelpCommand(client),
    new PingCommand(client),
    new QuickBenchCommand(client),
    new UwuCommand(client),
  ];
} else {
  activeCommands = [
    new CompilerExplorerCommand(client),
    new HelpCommand(client),
    new QuickBenchCommand(client),
  ];
}

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
