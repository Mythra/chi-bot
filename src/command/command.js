/**
 * Represents a base discord command class.
 */
class Command {
  /**
   * Create a command.
   *
   * @param {Object} opts
   *  The options for this command.
   */
  constructor({
    client,
    hasTimeout = true,
    regex,
    limitTo = [],
    timeoutSeconds = 3,
  }) {
    this.discord_client = client;
    this.regex = regex;
    this.hasTimeout = hasTimeout;

    if (this.hasTimeout) {
      this.timeoutMap = {};
      this.timeoutSeconds = timeoutSeconds;
    }

    this.limitUsers = [];
    this.limitRoles = [];
    limitTo.map(limitTo => {
      const [limitingType, id] = limitTo.split(':');
      if (limitingType == 'user') {
        this.limitUsers.push(id);
      } else if (limitingType == 'role') {
        this.limitRoles.push(id);
      } else {
        throw new Error(`Unknown limiting type: ${limitingType}`);
      }
    });
  }

  /**
   * Reject to a particular message in a standard way.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   * @param {String} emoji
   *  The emoji to use as a reaction.
   *  Defaults to the prohbited emoji.
   */
  _rejectMsg(msg, emoji = '🚫') {
    msg.react(emoji);
  }

  /**
   * Enforce any particular limits on roles/users.
   *
   * @param {Discord.Message} msg
   *  The discord message
   * @return {Boolean}
   *  If you should keep processing.
   */
  _enforceAccess(msg) {
    if (this.limitRoles.length > 0) {
      if (msg['author'] == null || msg['author']['roles'] == null) {
        this._rejectMsg(msg);
        return false;
      }
      if (
        !message.author.roles.some(role => this.limitRoles.includes(role.id))
      ) {
        this._rejectMsg(msg);
        return false;
      }
    }

    if (this.limitUsers.length > 0) {
      if (msg['author'] == null || msg['author']['id'] == null) {
        this._rejectMsg(msg);
        return false;
      }
      if (!this.limitUsers.includes(msg.author.id)) {
        this._rejectMsg(msg);
        return false;
      }
    }

    return true;
  }

  /**
   * Enforce any particular timeout limits.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   * @return {Boolean}
   *  If you should keep processing.
   */
  _enforceTimeout(msg) {
    if (!this.hasTimeout) {
      return true;
    }

    const timestamp = new Date().getTime() / 1000;
    if (msg['channel'] == null || msg['channel']['id'] == null) {
      this._rejectMsg(msg, '⏳');
      return false;
    }
    if (msg.channel.id in this.timeoutMap) {
      const lastMsg = this.timeoutMap[msg.channel.id];
      if (timestamp - lastMsg < this.timeoutSeconds) {
        this._rejectMsg(msg, '⏳');
        return false;
      }
    }
    this.timeoutMap[msg.channel.id] = timestamp;

    return true;
  }

  /**
   * Default NO-OP command handler.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   */
  async onMsg(msg) {}

  /**
   * Handle a new discord message coming in.
   *
   * @param {Discord.Message} msg
   *  The discord message that came in.
   */
  async onMessage(msg) {
    if (!this._enforceAccess(msg)) {
      return;
    }
    if (!this._enforceTimeout(msg)) {
      return;
    }

    await this.onMsg(msg);
  }
}

module.exports = {
  Command: Command,
};
