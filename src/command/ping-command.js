const Command = require('./command.js').Command;

/**
 * A ping command is responsible for ensuring the bot is alive.
 */
class PingCommand extends Command {
  /**
   * Create this ping command.
   *
   * @param {Discord.Client} client
   *  The discord client.
   */
  constructor(client) {
    super({
      client,
      hasTimeout: false,
      regex: new RegExp('^<@(!|&)?[0-9]+> ping(.*)?', 'gm'),
    });
  }

  /**
   * Called when it's time for ping command to process a message.
   *
   * @param {Discord.Message} msg
   *  The message that was sent.
   */
  async onMsg(msg) {
    msg.channel.send('PONG!');
  }
}

module.exports = {
  command: PingCommand,
};
