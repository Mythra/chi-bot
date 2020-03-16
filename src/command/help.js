const Command = require('./command.js').Command;
const discord = require('discord.js');

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
    const embed = new discord.MessageEmbed()
      .setColor('#C700BB')
      .setTitle('Help')
      .setDescription(
        'Hello! Welcome to Chi-Bot, your one stop shop for code integrations through discord!\n' +
          'For things that take input as code, it expects to be called like: "@chi-bot <action (e.g. "compile")> <args (e.g. --language "blah"> ```\n my code\n```."\n' +
          'Feel free to ping the_true_kungfury if you have any questions! She is okay with it!\n',
        'You can also find the source code here: https://github.com/SecurityInsanity/chi-bot.',
      )
      .addFields(
        {
          name: 'compile',
          value:
            'Take code, and see the compiled output. Possible arguments are "--compiler-args", "--libraries", "--language", and "--compiler"',
        },
        {
          name: 'bench',
          value:
            'Take C/C++ code, and run the benchmarks with google benchmark. Possible arguments are: "--language", "--compiler", "--std", "--optim", "--lib"',
        },
        {
          name: 'ping',
          value: '"@chi-bot ping" the bot to ensure it is online.',
        },
        {
          name: 'uwu',
          value: '"@chi-bot uwu" the bot in order to get an uwu back.',
        },
      );
    msg.author.send(embed);
    msg.channel.send('Help has been sent to you in DM.');
  }
}

module.exports = {
  command: HelpCommand,
};
