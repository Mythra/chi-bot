const Command = require('./command.js').Command;

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
      regex: new RegExp('^<@(!|&)?[0-9]+> help(.*)?', 'gm'),
      timeoutSeconds: 30,
    });
  }

  /**
   * Handle a new discord message.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   */
  async onMsg(msg) {
    msg.channel.send(
      'Hey! Welcome to Chi-Bot, your one stop shop for accessing compiler explorer through discord!\n' +
        'To run a compilation simply run: @chi-bot compile (args)? \\`\\`\\`\n<code>\n\\`\\`\\`\n' +
        'For example a simplistic command would be:\n\n' +
        '@chi-bot compile \\`\\`\\`c\nint a() { return 1 + 1; }\n\\`\\`\\`\n\n' +
        'You can also specify arguments (`--compiler-args`, `--libraries`, `--language`, `--compiler`) like so:\n' +
        '@chi-bot compile --language "cpp" \\`\\`\\`\nint a() { return 1 + 1; }\n\\`\\`\\`\n\n' +
        'If all else fails feel free to ping the_true_kungfury, or read the code at: https://github.com/SecurityInsanity/chi-bot',
    );
  }
}

module.exports = {
  command: HelpCommand,
};
