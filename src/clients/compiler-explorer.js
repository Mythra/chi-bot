const axios = require('axios');
const discord = require('discord.js');

/**
 * A Client for reaching out to compiler explorer.
 */
class CompilerExplorerClient {
  /**
   * Construct a new http client to reach out to compiler explorer.
   */
  constructor() {
    this.http_client = axios.create({
      baseURL: 'https://godbolt.org/api',
      timeout: 60000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Chi-Bot/1.0.0 DiscordBot Mythra',
      },
    });
    this.languagesSupported = {};
  }

  /**
   * Fetch the supported languages we can use for compiler explorer.
   */
  async fetchSupportedLanguages() {
    if (Object.keys(this.languagesSupported).length == 0) {
      const resp = await this.http_client.get('/languages?fields=id,name');
      const languages = resp.data;
      for (let idx = 0; idx < languages.length; ++idx) {
        const language = languages[idx];
        this.languagesSupported[language.name.toLowerCase()] = language.id;
      }
    }
  }

  /**
   * @return {Array<Object>}
   *  The list of supported languages.
   */
  getSupportedLanguages() {
    return this.languagesSupported;
  }

  /**
   * Derive the compiler to use.
   *
   * @param {String} lang
   *  The language name selected for use
   * @param {String} manuallySpecifiedCompiler
   *  The optional compiler arg to use.
   * @param {Object} msg
   *  The discord message object.
   * @return {String}
   *  The compiler ID to use.
   */
  async deriveCompilerForLang(lang, manuallySpecifiedCompiler, msg) {
    let compiler = '';
    if (manuallySpecifiedCompiler != null) {
      compiler = manuallySpecifiedCompiler.trim().toLowerCase();
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
            `Trying to use default.`,
        );
        compiler = '';
      }
    }

    if (compiler == '') {
      // Fetch default compiler.
      const resp = await this.http_client.get(
        '/languages?fields=name,defaultCompiler',
      );
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
   * @param {String?} manuallySpecifiedLibs
   *  The libraries argument passed in by a user.
   * @param {String} languageID
   *  The language ID to query.
   * @param {Object} msg
   *  The discord message object
   * @return {Array<Object>}
   *  A list of libraries to use.
   */
  async deriveLibraries(manuallySpecifiedLibs, languageID, msg) {
    if (manuallySpecifiedLibs == null) {
      return [];
    }
    const derived = [];
    const supportedLibraries = await this.http_client.get(
      `/libraries/${languageID}`,
    );
    const supportedLibData = supportedLibraries.data;
    const unfoundLibraries = [];

    manuallySpecifiedLibs
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
  sendCompileErrorFromData(msg, compilerData) {
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
   * @param {Boolean} showCompileOutput
   *  If we should show the compilation output.
   * @param {Boolean} alwaysShowRun
   *  If we should by default try to show run.
   * @param {Object} msg
   *  The message object from `discord.js`.
   */
  async compileCode(
    codeAsText,
    userArgs,
    languageID,
    compiler,
    showCompileOutput,
    alwaysShowRun,
    msg,
  ) {
    // Fetch the default compiler for this particular language.
    let compilerArgs = '';
    if (
      userArgs['compiler-args'] != null &&
      typeof userArgs['compiler-args'] === 'string'
    ) {
      compilerArgs = userArgs['compiler-args'];
    }
    const libraries = await this.deriveLibraries(
      userArgs['libraries'],
      languageID,
      msg,
    );

    let showRunOutput = alwaysShowRun;
    if (userArgs['run'] != null && !!userArgs['run']) {
      showRunOutput = true;
    }

    let clangTidyChecks;
    if (userArgs['checks'] != null && typeof userArgs['checks'] === 'string') {
      clangTidyChecks = userArgs['checks'];
    } else {
      clangTidyChecks =
        'abseil-*,bugprone-*,clang-analyzer-*,clang-diagnostic-*,modernize-*,performance-*,readability-braces-around-statements,readability-container-size-empty,readability-redundant-*,-abseil-no-internal-dependencies,-modernize-use-trailing-return-type';
    }

    let runArgs;
    if (
      userArgs['run-args'] != null &&
      typeof userArgs['run-args'] === 'string'
    ) {
      runArgs = userArgs['run-args'];
    } else {
      runArgs = '';
    }
    let runStdin;
    if (
      userArgs['run-stdin'] != null &&
      typeof userArgs['run-stdin'] === 'string'
    ) {
      runStdin = userArgs['run-stdin'];
    } else {
      runStdin = '';
    }

    console.log(
      'Compiling code: ',
      codeAsText.split('\n').join(' '),
      '\nArgs: ',
      compilerArgs,
      `\nChecks: [${clangTidyChecks}]`,
    );
    const compilerResp = await this.http_client.post(
      `/compiler/${compiler}/compile`,
      {
        source: codeAsText,
        compiler: compiler,
        lang: languageID,
        options: {
          userArguments: compilerArgs,
          compilerOptions: {},
          executeParameters: showRunOutput
            ? {
                args: runArgs,
                stdin: runStdin,
              }
            : {},
          filters: {
            binary: false,
            commentOnly: true,
            demangle: true,
            directives: true,
            execute: showRunOutput,
            intel: true,
            labels: true,
            libraryCode: false,
            trim: true,
          },
          tools: [
            {
              args: `-checks=${clangTidyChecks}`,
              id: 'clangtidytrunk',
            },
          ],
          libraries: libraries,
        },
        allowStoreCodeDebug: true,
      },
    );
    const compilerData = compilerResp.data;
    if (compilerData.code != 0) {
      this.sendCompileErrorFromData(msg, compilerData);
      throw new Error(
        `Compiler failed with bad status code: ${compilerData.code}.`,
      );
    }
    const asmInstructions = compilerData.asm;

    let clangTidyOutput = '';
    let clangTidyLines = 0;
    if (compilerData['tools'] != null && compilerData['tools'].length > 0) {
      const ctOutput = compilerData['tools'][0];
      if (
        ctOutput['code'] == 0 &&
        ctOutput['id'] == 'clangtidytrunk' &&
        ctOutput['stdout'] != null &&
        ctOutput['stdout'].length > 0
      ) {
        for (let idx = 0; idx < ctOutput.stdout.length; ++idx) {
          clangTidyOutput += ctOutput.stdout[idx].text;
          clangTidyOutput += '\n';
          clangTidyLines++;
        }
      }
    }

    const toShowItems = [];
    if (showCompileOutput && asmInstructions != null) {
      let compiledAsmString = '';
      let compiledAsmLines = 0;
      for (let idx = 0; idx < asmInstructions.length; ++idx) {
        compiledAsmString += asmInstructions[idx].text;
        compiledAsmString += '\n';
        compiledAsmLines += 1;
      }
      toShowItems.push({
        id: 'compile',
        data: compiledAsmString,
        lines: compiledAsmLines,
      });
    }

    if (showCompileOutput && clangTidyOutput != '') {
      toShowItems.push({
        id: 'clang-tidy',
        data: clangTidyOutput,
        lines: clangTidyLines,
      });
    }

    if (showRunOutput) {
      let runStdout = '';
      let runStdoutLines = 0;
      let runStderr = '';
      let runStderrLines = 0;

      if (compilerData['execResult']['stdout'] != null) {
        for (
          let idx = 0;
          idx < compilerData['execResult']['stdout'].length;
          ++idx
        ) {
          runStdout += compilerData['execResult']['stdout'][idx].text;
          runStdout += '\n';
          runStdoutLines++;
        }
      }
      if (compilerData['execResult']['stderr'] != null) {
        for (
          let idx = 0;
          idx < compilerData['execResult']['stderr'].length;
          ++idx
        ) {
          runStderr += compilerData['execResult']['stderr'][idx].text;
          runStderr += '\n';
          runStderrLines++;
        }
      }

      if (runStdout != '') {
        toShowItems.push({
          id: 'stdout',
          data: runStdout,
          lines: runStdoutLines,
        });
      }
      if (runStderr != '') {
        toShowItems.push({
          id: 'stderr',
          data: runStderr,
          lines: runStderrLines,
        });
      }
    }

    let linesInMsg = 0;
    let msgString = '';
    const msgAttachments = [];
    toShowItems.forEach(shownItem => {
      // This is to large, just add to data, without attempting to append message.
      if (linesInMsg + shownItem.lines > 50) {
        if (shownItem.id == 'compile') {
          msgAttachments.push(
            new discord.MessageAttachment(
              Buffer.from(shownItem.data, 'utf8'),
              'compile-code.s',
            ),
          );
        } else if (shownItem.id == 'clang-tidy') {
          msgAttachments.push(
            new discord.MessageAttachment(
              Buffer.from(shownItem.data, 'utf8'),
              'clang-tidy.txt',
            ),
          );
        } else {
          msgAttachments.push(
            new discord.MessageAttachment(
              Buffer.from(shownItem.data, 'utf8'),
              `${shownItem.id}.txt`,
            ),
          );
        }
      } else {
        linesInMsg += shownItem.lines;

        // Send as part of msg string.
        if (shownItem.id == 'compile') {
          const stringData = `Your code has been compiled to:\n\`\`\`x86asm\n${shownItem.data}\n\`\`\`.`;
          if (msgString == '') {
            msgString = stringData;
          } else {
            msgString += '\n';
            msgString += stringData;
          }
        } else if (shownItem.id == 'clang-tidy') {
          const stringData = `The following warnings were generated:\n\`\`\`text\n${shownItem.data}\n\`\`\`.`;
          if (msgString == '') {
            msgString = stringData;
          } else {
            msgString += '\n';
            msgString += stringData;
          }
        } else {
          const stringData = `${shownItem.id}:\n\`\`\`text\n${shownItem.data}\n\`\`\`.`;
          if (msgString == '') {
            msgString = stringData;
          } else {
            msgString += '\n';
            msgString += stringData;
          }
        }
      }
    });

    if (msgString == '') {
      msgString =
        "Your code was compiled successfully! The outputs were to large so we've attached them as files.";
    }
    msg.channel.send(msgString, msgAttachments);
  }
}

module.exports = {
  CompilerExplorerClient: CompilerExplorerClient,
};
