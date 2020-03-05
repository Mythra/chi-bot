/**
 * A command to insult mov whenever he pings the bot.
 */
class MovCommand {
  /**
   * Create an instance of this mov command.
   *
   * @param {Discord.Client} client
   *  The discord client instance.
   */
  constructor(client) {
    this.discord_client = client;
    this.prefix = new RegExp('^<@(!|&)?[0-9]+>(.*)?', 'gm');
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

    if (msg.author.id != '188383733072658432') {
      return;
    }

    msg.channel.send('Mov is not a good mod :(');
  }
}

module.exports = {
  command: MovCommand,
};
