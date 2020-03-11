const Command = require('./command.js').Command;

/**
 * A loss command is responsible for trolling members of the community.
 */
class LossCommand extends Command {
  /**
   * Create this loss command.
   *
   * @param {Discord.Client} client
   *  The discord client.
   */
  constructor(client) {
    super({
      client,
      regex: new RegExp('^<@(!|&)?[0-9]+> loss(.*)?', 'gm'),
    });
  }

  /**
   * Called when it's time for loss command to process a message.
   *
   * @param {Discord.Message} msg
   *  The message that was sent.
   */
  async onMsg(msg) {
    if (Math.floor(Math.random() * 2) == 0) {
      msg.channel.send('| ||\n|| |_');
    } else {
      msg.channel.send('No loss here.');
    }
  }
}

module.exports = {
  command: LossCommand,
};
