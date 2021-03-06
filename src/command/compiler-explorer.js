const Command = require('./command.js').Command;

/**
 * A discord command responsible for reaching out to compiler explorer,
 * and compiling user provided code. It will spit back out the output of the
 * compiled code.
 */
class CompilerExplorerCommand extends Command {
  /**
   * Construct this command.
   *
   * @param {Discord.Client} client
   *  The discord client to use.
   * @param {CompilerExplorerClient} ceClient
   *  The compiler explorer client.
   */
  constructor(client, ceClient) {
    super({
      client,
      prefix: 'compile',
      prefixNeedsAfter: true,
    });

    this.ceClient = ceClient;
  }

  /**
   * Process a message from discord.
   *
   * @param {Discord.Message} msg
   *  The message to process.
   */
  async onMsg(msg) {
    const msgContent = msg.content.trim();
    await this.ceClient.fetchSupportedLanguages();
    const languagesSupported = this.ceClient.getSupportedLanguages();

    const arr = this.extractFromCodeblockSafely(msgContent);
    if (arr == null) {
      return;
    }
    let langTag = arr[0];
    const codeAst = arr[1];

    const args = this.extractRawArgs(
      msgContent.substring(
        msgContent.indexOf('> compile') + '> compile'.length,
        msgContent.indexOf('```'),
      ),
    );
    if (args['language'] != null && args['language'].trim() != '') {
      langTag = args['language'];
    }
    if (langTag == null || langTag == '') {
      langTag = 'c++';
    }

    if (!(langTag in languagesSupported)) {
      msg.channel.send(
        `Unknown Language: ${langTag}. Supported languages are: ${Object.keys(
          languagesSupported,
        ).join(', ')}.`,
      );
      return;
    }

    let compiler = '';
    try {
      compiler = await this.ceClient.deriveCompilerForLang(
        langTag,
        args['compiler'],
        msg,
      );
    } catch (err) {
      msg.channel.send(
        `Failed to derive Compiler! Compiler list can be found at: <https://api.godbolt.org/compilers/${languagesSupported[langTag]}>.`,
      );
      console.log(err);
      return;
    }
    if (compiler == null || compiler == '') {
      msg.channel.send(
        `No known, or default Compiler, for language "${langTag}".` +
          `Please specify one manually with the --compiler arg. Compiler list can be found at: <https://api.godbolt.org/compilers/${languagesSupported[langTag]}>.`,
      );
      return;
    }
    const code = codeAst.value.trim();
    if (code.length == 0) {
      return;
    }

    try {
      await this.ceClient.compileCode(
        code,
        args,
        languagesSupported[langTag],
        compiler,
        true,
        false,
        msg,
      );
    } catch (err) {
      msg.channel.send('Failed to compile code!');
      console.log(err);
      return;
    }
  }
}

module.exports = {
  command: CompilerExplorerCommand,
};
