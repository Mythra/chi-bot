/**
 * A command to respond to uwu's.
 */
class UwuCommand {
  /**
   * Create an instance of this uwu command.
   *
   * @param {Discord.Client} client
   *  The discord client instance.
   */
  constructor(client) {
    this.discord_client = client;
    this.prefix = new RegExp('^<@(!|&)?[0-9]+> uwu(.*)?', 'gm');
  }

  /**
   * Handle a message received from discord.
   *
   * @param {Discord.Message} msg
   *  The message received from discord.
   */
  async onMessage(msg) {
    const msgContent = msg.content.trim();
    if (msgContent.match(this.prefix) == null) {
      return;
    }
    if (msg.mentions.users.length >= 1) {
      if (msg.mentions.users.first().id != this.discord_client.user.id) {
        return;
      }
    } else if (msg.mentions.roles.length >= 1) {
      if (
        !this.discord_client.user.roles.has(msg.mentions.roles.first().name)
      ) {
        return;
      }
    }

    msg.channel.send('uwu7');
  }
}

module.exports = {
  command: UwuCommand,
};
