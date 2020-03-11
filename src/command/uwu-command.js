const Command = require('./command.js').Command;

/**
 * A command to respond to uwu's.
 */
class UwuCommand extends Command {
  /**
   * Create an instance of this uwu command.
   *
   * @param {Discord.Client} client
   *  The discord client instance.
   */
  constructor(client) {
    super({
      client,
      hasTimeout: false,
      regex: new RegExp('^<@(!|&)?[0-9]+> uwu(.*)?', 'gm'),
    });
  }

  /**
   * Handle a message received from discord.
   *
   * @param {Discord.Message} msg
   *  The message received from discord.
   */
  async onMsg(msg) {
    msg.channel.send('uwu7');
  }
}

module.exports = {
  command: UwuCommand,
};
