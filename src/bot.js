#!/usr/bin/env node

const Discord = require('discord.js');
const client = new Discord.Client();

const CompilerExplorerClient = require('./clients/compiler-explorer.js')
  .CompilerExplorerClient;
const ceClient = new CompilerExplorerClient();

const CompilerExplorerCommand = require('./command/compiler-explorer.js')
  .command;
const RunCommand = require('./command/run-command.js').command;
const HelpCommand = require('./command/help.js').command;
const PingCommand = require('./command/ping-command.js').command;
const QuickBenchCommand = require('./command/quick-bench.js').command;
const UwuCommand = require('./command/uwu-command.js').command;

let activeCommands;
if (process.env.MINIMAL == '1') {
  activeCommands = [
    new CompilerExplorerCommand(client, ceClient),
    new RunCommand(client, ceClient),
    new HelpCommand(client),
    new QuickBenchCommand(client),
  ];
} else {
  activeCommands = [
    new CompilerExplorerCommand(client, ceClient),
    new RunCommand(client, ceClient),
    new HelpCommand(client),
    new PingCommand(client),
    new QuickBenchCommand(client),
    new UwuCommand(client),
  ];
}

const makeBottom = require('./command/make-bottom.js').dg;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on('message', msg => {
  if (msg.author.bot) {
    return;
  }
  if (process.env.ENFORCE_BOTTOM) {
    (async () => await makeBottom(msg))();
  }
  for (let idx = 0; idx < activeCommands.length; ++idx) {
    (async () => await activeCommands[idx].onMessage(msg))();
  }
});

client.login(process.env.CHI_BOT_DISCORD_TOKEN);
