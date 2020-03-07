/**
 * A discord command responsible for providing a help command for
 */
class HelpCommand {
  /**
   * Construct this help command.
   *
   * @param {Discord.Client} client
   *  The discord client.
   */
  constructor(client) {
    this.cooldownMap = {};
    this.discord_client = client;
    this.prefix = new RegExp('^<@(!|&)?[0-9]+> help(.*)?', 'gm');
  }

  /**
   * Handle a new discord message.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   */
  async onMessage(msg) {
    const timestamp = new Date().getTime() / 1000;
    if (msg.channel.id in this.cooldownMap) {
      const lastMsg = this.cooldownMap[msg.channel.id];
      // 30 second cooldown.
      if (timestamp - lastMsg < 30) {
        return;
      }
    }
    this.cooldownMap[msg.channel.id] = timestamp;

    const msgContent = msg.content.trim();
    if (msgContent.match(this.prefix) == null) {
      return;
    }
    if (msg.mentions.users == null) {
      return;
    }
    if (msg.mentions.users.first() == null) {
      return;
    }
    if (msg.mentions.users.first().id != this.discord_client.user.id) {
      return;
    }

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
