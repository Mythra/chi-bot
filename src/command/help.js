const Command = require('./command.js').Command;
const discord = require('discord.js');

const COMPILE_HELP = {
  name: 'compile',
  value:
    'Take code, and see the compiled output. Possible arguments are "--compiler-args", "--run", "--run-args", "--run-stdin", "--libraries", "--language", and "--compiler"',
};
const RUN_HELP = {
  name: 'run',
  value:
    'Take code, and run it, never showing the compiled output. Accepts the same arguments as `compile`.',
};
const BENCH_HELP = {
  name: 'bench',
  value:
    'Take C/C++ code, and run the benchmarks with google benchmark. Possible arguments are: "--language", "--compiler", "--std", "--optim", "--lib"',
};
const PING_HELP = {
  name: 'ping',
  value: '"@chi-bot ping" the bot to ensure it is online.',
};
const UWU_HELP = {
  name: 'uwu',
  value: '"@chi-bot uwu" the bot in order to get an uwu back.',
};

/**
 * A discord command responsible for providing a help command for
 */
class HelpCommand extends Command {
  /**
   * Construct this help command.
   *
   * @param {Discord.Client} client
   *  The discord client.
   */
  constructor(client) {
    super({
      client,
      prefix: 'help',
    });
  }

  /**
   * Handle a new discord message.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   */
  async onMsg(msg) {
    let embed;

    if (process.env.MINIMAL != '1') {
      embed = new discord.MessageEmbed()
        .setColor('#C700BB')
        .setTitle('Help')
        .setDescription(
          'Hello! Welcome to Chi-Bot, your one stop shop for code integrations through discord!\n' +
            'For things that take input as code, it expects to be called like: "@chi-bot <action (e.g. "compile")> <args (e.g. --language "blah"> \\`\\`\\` my code \\`\\`\\`."\n' +
            'Feel free to ping Mythra#1337 if you have any questions! She is okay with it!',
        )
        .addFields(COMPILE_HELP, RUN_HELP, BENCH_HELP, PING_HELP, UWU_HELP);
    } else {
      embed = new discord.MessageEmbed()
        .setColor('#C700BB')
        .setTitle('Help')
        .setDescription(
          'Hello! Welcome to Chi-Bot, your one stop shop for code integrations through discord!\n' +
            'For things that take input as code, it expects to be called like: "@chi-bot <action (e.g. "compile")> <args (e.g. --language "blah"> \\`\\`\\` my code \\`\\`\\`."\n' +
            'Feel free to ping Mythra#1337 if you have any questions! She is okay with it!',
        )
        .addFields(COMPILE_HELP, RUN_HELP, BENCH_HELP);
    }
    msg.author.send(embed);
    msg.channel.send('Help has been sent to you in DM.');
  }
}

module.exports = {
  command: HelpCommand,
};
