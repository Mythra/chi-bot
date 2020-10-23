const axios = require('axios');
const Command = require('./command.js').Command;
const discord = require('discord.js');
const vega = require('vega');

/**
 * Represents a command that reaches out to QuickBench in order
 * to benchmark code directly from discord.
 */
class QuickBenchCommand extends Command {
  /**
   * Create a QuickBench command.
   *
   * @param {Discord.Client} client
   *  The discord client.
   */
  constructor(client) {
    super({
      client,
      prefix: 'bench',
      prefixNeedsAfter: true,
      timeoutSeconds: 10,
    });

    this.http_client = axios.create({
      baseURL: 'https://quick-bench.com',
      timeout: 70000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Chi-Bot/1.0.0 DiscordBot Mythra',
      },
    });

    this.supported_compilers = [
      'clang-3.8',
      'clang-3.9',
      'clang-4.0',
      'clang-5.0',
      'clang-6.0',
      'clang-7.0',
      'clang-7.1',
      'clang-8.0',
      'clang-9.0',
      'clang-10.0',
      'gcc-5.5',
      'gcc-6.4',
      'gcc-6.5',
      'gcc-7.2',
      'gcc-7.3',
      'gcc-7.4',
      'gcc-7.5',
      'gcc-8.1',
      'gcc-8.2',
      'gcc-8.3',
      'gcc-8.4',
      'gcc-9.1',
      'gcc-9.2',
      'gcc-9.3',
      'gcc-10.1',
    ];
    this.supported_std = {
      'c++11': '11',
      'c++14': '14',
      'c++17': '17',
      'c++20': '20',
    };
    this.optim_levels = ['g', '0', '1', '2', 's', '3', 'f'];
    this.supported_stls = ['llvm', 'gnu'];
  }

  /**
   * Generate a link to quickbench.
   *
   * @param {String} cppCode
   *  The C++ Code.
   * @return {String}
   *  The Link to open this in quick-bench.
   */
  _longQuickBenchLink(cppCode) {
    return (
      'https://quick-bench.com/#' +
      Buffer.from(
        JSON.stringify({
          text: cppCode,
        }).replace(/[\u007F-\uFFFF]/g, function(chr) {
          // json unicode escapes must always be 4 characters long, so pad with leading zeros
          return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4);
        }),
      ).toString('base64')
    );
  }

  /**
   * Run a benchmark on quick-bench.
   *
   * @param {Discord.Message} msg
   *  The discord message instance.
   * @param {Object} args
   *  The arguments for quick bench.
   * @param {String} cppCode
   *  The CPP Code as a string.
   */
  async _runBench(msg, args, cppCode) {
    let compiler;
    if (args['compiler'] != null) {
      compiler = args['compiler'].toLowerCase();
    } else {
      compiler = 'clang-9.0';
    }
    if (!this.supported_compilers.includes(compiler)) {
      msg.channel.send(
        `Unknown Compiler: [${compiler}], Known Compilers are: ${this.supported_compilers.join(
          ', ',
        )}.`,
      );
      return;
    }

    let std;
    if (args['std'] != null) {
      std = args['std'].toLowerCase();
    } else {
      std = 'c++20';
    }
    if (!Object.keys(this.supported_std).includes(std)) {
      msg.channel.send(
        `Unknown Standard: [${std}], Known Standard Versions are: ${Object.keys(
          this.supported_std,
        ).join(', ')}.`,
      );
      return;
    }

    let optim;
    if (args['optim'] != null) {
      optim = args['optim'].toLowerCase();
    } else {
      optim = '3';
    }
    if (!this.optim_levels.includes(optim)) {
      msg.channel.send(
        `Unknown Optimization Level: [${optim}], Known Levels are: ${this.optim_levels.join(
          ', ',
        )}.`,
      );
      return;
    }
    optim = optim.toUpperCase();

    let lib;
    if (args['lib'] != null) {
      lib = args['lib'].toLowerCase();
    } else {
      lib = 'llvm';
    }
    if (!this.supported_stls.includes(lib)) {
      msg.channel.send(
        `Unknown Standard Library: [${lib}], Known Standard libraries are: ${this.supported_stls.join(
          ', ',
        )}.`,
      );
      return;
    }

    this._markWaiting(msg);

    const resp = await this.http_client.post('/quick/', {
      protocolVersion: 4,
      force: false,
      isAnnotated: false,
      code: cppCode,
      options: {
        compiler: compiler,
        cppVersion: this.supported_std[std],
        lib: lib,
      },
    });

    const vizGraphData = {
      $schema: 'https://vega.github.io/schema/vega/v5.7.json',
      width: 1280,
      height: 720,
      padding: 10,
      data: [
        {
          name: 'table',
          values: [],
        },
      ],
      scales: [
        {
          name: 'xscale',
          type: 'band',
          domain: { data: 'table', field: 'category' },
          range: 'width',
          padding: 0.1,
          round: true,
        },
        {
          name: 'yscale',
          domain: { data: 'table', field: 'amount' },
          nice: true,
          range: 'height',
        },
      ],
      axes: [
        {
          labelColor: '#C700BB',
          labelFontSize: 20,
          labelFontStyle: 'bold',
          labels: true,
          orient: 'bottom',
          scale: 'xscale',
        },
        {
          labelColor: '#C700BB',
          labelFontSize: 20,
          labelFontStyle: 'bold',
          labels: true,
          orient: 'left',
          scale: 'yscale',
        },
      ],
      marks: [
        {
          type: 'rect',
          from: { data: 'table' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'category' },
              width: { scale: 'xscale', band: 1 },
              y: { scale: 'yscale', field: 'amount' },
              y2: { scale: 'yscale', value: 0 },
            },
            update: {
              fill: { value: '#FA86DF' },
            },
          },
        },
      ],
      title: {
        text: 'Benchmark Results',
        subtitle: 'All time values are CPU Time - Lower Means Faster',
        color: '#C700BB',
        fontStyle: 'bold',
        subtitleFontStyle: 'bold',
        fontSize: 30,
        subtitleFontSize: 25,
        subtitleColor: '#C700BB',
      },
    };

    if (resp.data['result'] == null) {
      msg.author.send(
        'Benchmark Failures. Note may contain color codes for a shell, may be best to print out in your shell.',
        new discord.MessageAttachment(
          Buffer.from(resp.data.message, 'utf8'),
          'quick-bench-error.txt',
        ),
      );
      msg.channel.send('Benchmark Code Failed, or Timed Out!');
    } else {
      resp.data.result.benchmarks.forEach(benchmark => {
        vizGraphData.data[0].values.push({
          amount: benchmark.cpu_time,
          category: benchmark.name,
        });
      });
      const view = new vega.View(vega.parse(vizGraphData), {
        renderer: 'none',
      });
      const canvas = await view.toCanvas();
      const pngBuff = canvas.toBuffer();

      let url = this._longQuickBenchLink(cppCode);
      if (resp.data['id'] != null) {
        url = `https://quick-bench.com/q/${resp.data['id']}`;
      }

      msg.channel.send(
        `Benchmark Results. View online at: ${url}`,
        new discord.MessageAttachment(pngBuff, 'benchmark.png'),
      );
    }
  }

  /**
   * Process a particular discord message.
   *
   * @param {Discord.Message} msg
   *  The discord message.
   */
  async onMsg(msg) {
    const msgContent = msg.content.trim();

    const arr = this.extractFromCodeblockSafely(msgContent);
    if (arr == null) {
      return;
    }
    let langTag = arr[0];
    const codeAst = arr[1];

    const args = this.extractRawArgs(
      msgContent.substring(
        msgContent.indexOf('> bench') + '> bench'.length,
        msgContent.indexOf('```'),
      ),
    );
    if (args['language'] != null && args['language'].trim() != '') {
      langTag = args['language'];
    }
    if (langTag == null || langTag == '') {
      langTag = 'c++';
    }

    if (langTag != 'c++' && langTag != 'c') {
      msg.channel.send('QuickBench only supports C & C++ code right now.');
      return;
    }
    const code = codeAst.value.trim();

    try {
      await this._runBench(msg, args, code);
    } catch (err) {
      console.log('QuickBench ERR', err);
      msg.channel.send('QuickBench responded with error!');
      return;
    }
  }
}

module.exports = {
  command: QuickBenchCommand,
};
