const axios = require('axios');
const Command = require('./command.js').Command;
const discord = require('discord.js');

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
   */
  constructor(client) {
    super({
      client,
      prefix: 'compile',
      prefixNeedsAfter: true,
    });

    this.http_client = axios.create({
      baseURL: 'https://godbolt.org/api',
      timeout: 60000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Chi-Bot/1.0.0 DiscordBot SecurityInsanity',
      },
    });
    this.languagesSupported = {};
  }

  /**
   * Fetch the supported languages we can use for compiler explorer.
   */
  async _fetchSupportedLanguages() {
    const resp = await this.http_client.get('/languages');
    const languages = resp.data;
    for (let idx = 0; idx < languages.length; ++idx) {
      const language = languages[idx];
      this.languagesSupported[language.name.toLowerCase()] = language.id;
    }
  }

  /**
   * Derive the compiler to use.
   *
   * @param {String} lang
   *  The language name selected for use
   * @param {String} compilerArg
   *  The optional compiler arg to use.
   * @param {Object} msg
   *  The discord message object.
   * @return {String}
   *  The compiler ID to use.
   */
  async _deriveCompilerForLang(lang, compilerArg, msg) {
    let compiler = '';
    if (compilerArg != null) {
      compiler = compilerArg.trim().toLowerCase();
    }
    if (compiler != '') {
      // Fetch list of supported compilers to ensure it matches.
      const resp = await this.http_client.get(
        `/compilers/${this.languagesSupported[lang]}`,
      );
      const compilers = resp.data;
      let foundCompiler = false;
      for (let idx = 0; idx < compilers.length; ++idx) {
        const compilerObj = compilers[idx];
        if (
          compilerObj.name.toLowerCase() == compiler ||
          compilerObj.id.toLowerCase() == compiler
        ) {
          compiler = compilerObj.id;
          foundCompiler = true;
          break;
        }
      }
      if (!foundCompiler) {
        msg.channel.send(
          `Unknown Compiler "${compiler}", for language "${lang}".` +
            `Using default.`,
        );
        compiler = '';
      }
    }

    if (compiler == '') {
      // Fetch default compiler.
      const resp = await this.http_client.get('/languages');
      const languages = resp.data;
      for (let idx = 0; idx < languages.length; ++idx) {
        if (languages[idx].name.toLowerCase() == lang) {
          compiler = languages[idx].defaultCompiler;
          break;
        }
      }
    }

    return compiler;
  }

  /**
   * Derive valid libraries to use.
   *
   * @param {String?} librariesArg
   *  The libraries argument passed in by a user.
   * @param {String} languageID
   *  The language ID to query.
   * @param {Object} msg
   *  The discord message object
   * @return {Array<Object>}
   *  A list of libraries to use.
   */
  async _deriveLibraries(librariesArg, languageID, msg) {
    if (librariesArg == null) {
      return [];
    }
    const derived = [];
    const supportedLibraries = await this.http_client.get(
      `/libraries/${languageID}`,
    );
    const supportedLibData = supportedLibraries.data;
    const unfoundLibraries = [];

    librariesArg
      .trim()
      .split(',')
      .forEach(item => {
        if (item == '') {
          return;
        }
        let foundLib = false;
        for (let idx = 0; idx < supportedLibData.length; ++idx) {
          const libData = supportedLibData[idx];
          if (
            libData.name.toLowerCase() == item ||
            libData.id.toLowerCase() == item
          ) {
            foundLib = true;
            derived.push({
              id: libData.id,
              version: libData.versions.last().id,
            });
            break;
          }
        }
        if (!foundLib) {
          unfoundLibraries.push(item);
        }
      });

    if (unfoundLibraries.length > 0) {
      msg.channel.send(
        `Couldn't find the libraries: ${unfoundLibraries.join(
          ', ',
        )}, just not including them.`,
      );
    }

    return derived;
  }

  /**
   * Send a compiler error message.
   *
   * @param {Discord.Message} msg
   *  The discord message object.
   * @param {Object} compilerData
   *  The compiler data message.
   */
  _sendCompilerError(msg, compilerData) {
    let stdoutString = '';
    let stderrString = '';
    let taggedString = '';

    if ('stdout' in compilerData) {
      const stdoutObjects = compilerData['stdout'];
      for (let idx = 0; idx < stdoutObjects.length; ++idx) {
        const obj = stdoutObjects[idx];
        if ('tag' in obj) {
          taggedString += `Tagged Important Line: ${obj.tag}\n`;
        }
        if ('text' in obj) {
          stdoutString += obj.text;
          stdoutString += '\n';
        }
      }
    }
    if ('stderr' in compilerData) {
      const stderrObjects = compilerData['stderr'];
      for (let idx = 0; idx < stderrObjects.length; ++idx) {
        const obj = stderrObjects[idx];
        if ('tag' in obj) {
          if ('text' in obj.tag) {
            taggedString += `Tagged Important Line: ${obj.tag.text}\n`;
          }
        }
        if ('text' in obj) {
          stderrString += obj.text;
          stderrString += '\n';
        }
      }
    }

    stdoutString = stdoutString.trim();
    stderrString = stderrString.trim();
    taggedString = taggedString.trim();

    const attachments = [];
    if (stdoutString != '') {
      attachments.push(
        new discord.MessageAttachment(
          Buffer.from(stdoutString, 'utf8'),
          'stdout.txt',
        ),
      );
    }
    if (stderrString != '') {
      attachments.push(
        new discord.MessageAttachment(
          Buffer.from(stderrString, 'utf8'),
          'stderr.txt',
        ),
      );
    }

    if (taggedString != '') {
      msg.author.send(
        'Compiler Error! Note may contain color codes for a shell, may be best to print out in your shell. Tagged output: \n```text\n' +
          taggedString +
          '\n```',
        attachments,
      );
    } else {
      msg.author.send('Compiler Error Output', attachments);
    }
  }

  /**
   * Compile code, and respond with the compiled code.
   *
   * @param {String} codeAsText
   *  The code as text.
   * @param {Object} userArgs
   *  The arguments parsed from chi-bot.
   * @param {String} languageID
   *  The ID of the library
   * @param {String} compiler
   *  The ID of the compiler to use.
   * @param {Object} msg
   *  The message object from `discord.js`.
   */
  async _compileCode(codeAsText, userArgs, languageID, compiler, msg) {
    // Fetch the default compiler for this particular language.
    let compilerArgs = '';
    if (userArgs['compiler-args'] != null) {
      compilerArgs = userArgs['compiler-args'];
    }
    const libraries = await this._deriveLibraries(
      userArgs['libraries'],
      languageID,
      msg,
    );

    console.log(
      'Compiling code: ',
      codeAsText.split('\n').join(' '),
      '\nArgs: ',
      compilerArgs,
    );
    const compilerResp = await this.http_client.post(
      `/compiler/${compiler}/compile`,
      {
        source: codeAsText,
        options: {
          userArguments: compilerArgs,
          compilerOptions: {},
          filters: {
            binary: false,
            commentOnly: true,
            demangle: true,
            directives: true,
            execute: false,
            intel: true,
            labels: true,
            libraryCode: false,
            trim: true,
          },
          tools: [],
          libraries: libraries,
        },
        allowStoreCodeDebug: true,
      },
    );
    const compilerData = compilerResp.data;
    if (compilerData.code != 0) {
      this._sendCompilerError(msg, compilerData);
      throw new Error(
        `Compiler failed with bad status code: ${compilerData.code}.`,
      );
    }
    const asmInstructions = compilerData.asm;

    let compiledAsmString = '';
    for (let idx = 0; idx < asmInstructions.length; ++idx) {
      compiledAsmString += asmInstructions[idx].text;
      compiledAsmString += '\n';
    }

    if (asmInstructions.length < 50) {
      msg.channel.send(
        `Here's your compiled code:\n\`\`\`x86asm\n${compiledAsmString}\n\`\`\``,
      );
    } else {
      const attachment = new discord.MessageAttachment(
        Buffer.from(compiledAsmString, 'utf8'),
        'compiled-code.s',
      );
      msg.channel.send('Compiled!', attachment);
    }
  }

  /**
   * Process a message from discord.
   *
   * @param {Discord.Message} msg
   *  The message to process.
   */
  async onMsg(msg) {
    const msgContent = msg.content.trim();

    if (Object.keys(this.languagesSupported).length == 0) {
      await this._fetchSupportedLanguages();
    }

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

    if (!(langTag in this.languagesSupported)) {
      msg.channel.send(
        `Unknown Language: ${langTag}. Supported languages are: ${Object.keys(
          this.languagesSupported,
        ).join(', ')}.`,
      );
      return;
    }

    let compiler = '';
    try {
      compiler = await this._deriveCompilerForLang(
        langTag,
        args['compiler'],
        msg,
      );
    } catch (err) {
      msg.channel.send('Failed to derive Compiler!');
      console.log(err);
      return;
    }
    const code = codeAst.value.trim();
    if (code.length == 0) {
      return;
    }

    try {
      await this._compileCode(
        code,
        args,
        this.languagesSupported[langTag],
        compiler,
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
