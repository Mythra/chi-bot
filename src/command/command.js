const argParse = require('yargs-parser');
const parseMarkdown = require('@textlint/markdown-to-ast').parse;

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
    limitTo = [],
    prefix,
    prefixNeedsAfter = false,
    timeoutSeconds = 3,
  }) {
    this.discord_client = client;
    this.hasTimeout = hasTimeout;
    this.regex = null;

    if (this.regex == null && prefix != null && prefix.trim() != '') {
      if (prefixNeedsAfter) {
        this.regex = new RegExp(`^<@(!|&)?[0-9]+> ${prefix}.*`, 'gim');
      } else {
        this.regex = new RegExp(`^<@(!|&)?[0-9]+> ${prefix}(.*)?`, 'gim');
      }
    }
    if (this.regex == null) {
      throw new Error('Command does not have a regex!');
    }
    if (this.discord_client == null) {
      throw new Error('Command does not have a discord client!');
    }

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
   * Mark a message as being processed.
   *
   * @param {Discord.Message} msg
   *  The discord message to react to.
   */
  _markWaiting(msg) {
    msg.react('🕒');
  }

  /**
   * The argument string.
   *
   * @param {String} argStr
   *  The string to parse for arguments.
   * @return {Object}
   *  an object of {arg_key: arg_value}
   */
  extractRawArgs(argStr) {
    return argParse(argStr);
  }

  /**
   * Safely extract code from a code block.
   * Only works with a single code block.
   *
   * @param {String?} msgContent
   *  The full message content.
   * @return {Array<String>?}
   *  The code within the code block if we could extract it.
   */
  extractFromCodeblockSafely(msgContent) {
    if (msgContent == null || msgContent.trim() == '') {
      return null;
    }

    const codeBlockCount = (msgContent.match(/```/g) || []).length;
    if (codeBlockCount != 2) {
      return null;
    }
    const codeContent = msgContent.substring(
      msgContent.indexOf('```') + 3,
      msgContent.lastIndexOf('```'),
    );

    let startsWithLanguageTag = false;
    // An array of strings of: `Tag;LanguageID`.
    // Extracted from highlightjs && compiler explorer supported languages.
    //
    // This is needed to "normalize" markdown. Because discord allows codeblocks all
    // on a single line, but that isn't actually valid markdown so the markdown parser
    // barfs on it. So we need to know if there's a language tag so we properly format
    // the code incase there is no newline at the begginging.
    //
    // E.g. ```cpp int a() {} ``` needs to become: ```cpp\n int a() {}\n```
    // While: ```int a() {}``` needs to become: ```\nint a() {}\n```
    const supportedLanguagesKey = [
      'ActionScript;as',
      'as;as',
      'analysis;analysis',
      'Apache Access Log;aal',
      'Augmented Backus-Naur Form;abnf',
      '1C:Enterprise;1ce',
      'Ada;ada',
      'AngelScript;asc',
      'asc;asc',
      'Apache config;apacheconf',
      'apacheconf;apacheconf',
      'AppleScript;osascript',
      'osascript;osascript',
      'ArcGIS Arcade;arcade',
      'arcade;arcade',
      'Arduino;c++',
      'ARM Assembly;assembly',
      'arm;assembly',
      'AsciiDoc;adoc',
      'adoc;adoc',
      'AspectJ;asj',
      'AutoHotkey;ahk',
      'ahk;ahk',
      'AutoIt;ait',
      'AVR Assembly;assembly',
      'Awk;awk',
      'Dynamics 365;axapta',
      'Bash;sh',
      'sh;sh',
      'zsh;sh',
      'BASIC;basic',
      'Backus–Naur Form;bnf',
      'Brainfuck;bf',
      'bf;bf',
      'C/AL;cal',
      'Cap’n Proto;capnp',
      'capnp;capnp',
      'Ceylon;ceylon',
      'Clean;clean',
      'icl;clean',
      'dcl;clean',
      'Clojure REPL;clj',
      'Clojure;clj',
      'clj;clj',
      'CMake;cmake',
      'cmake.in;cmake',
      'CoffeeScript;coffee',
      'coffee;coffee',
      'cson;coffee',
      'iced;coffee',
      'Coq;coq',
      'cuda;cuda',
      'Caché Object Script;cos',
      'cos;cos',
      'cls;cos',
      'C++;c++',
      'cpp;c++',
      'cppx;cppx',
      'c++x;cppx',
      'cc;c++',
      'h++;c++',
      'hpp;c++',
      'hh;c++',
      'hxx;c++',
      'cxx;c++',
      'crmsh;crmsh',
      'crm;crmsh',
      'pcmk;crmsh',
      'Crystal;cr',
      'cr;cr',
      'C#;cs',
      'cs;cs',
      'CSP;csp',
      'CSS;css',
      'Dart;dart',
      'Delphi;pascal',
      'dpr;pascal',
      'dfm;pascal',
      'pas;pascal',
      'pascal;pascal',
      'freepascal;pascal',
      'lazarus;pascal',
      'lpr;pascal',
      'lfm;pascal',
      'Diff;patch',
      'patch;patch',
      'Django;jinja',
      'jinja;jinja',
      'ispc;ispc',
      'DNS Zone;bind',
      'bind;bind',
      'zone;bind',
      'Dockerfile;docker',
      'docker;docker',
      'Batch file (DOS);bat',
      'bat;bat',
      'cmd;bat',
      'Device Tree;dt',
      'Dust;dst',
      'dst;dst',
      'Extended Backus-Naur Form;ebnf',
      'Elixir;elixir',
      'Elm;elm',
      'ERB;erb',
      'Erlang REPL;erl',
      'Erlang;erl',
      'erl;erl',
      'Excel formulae;xls',
      'xlsx;xls',
      'xls;xls',
      'FIX;fix',
      'Flix;flix',
      'Fortran;fortran',
      'f90;fortran',
      'f95;f95',
      'F#;fs',
      'fs;fs',
      'GAMS;gms',
      'gms;gms',
      'GAUSS;gss',
      'gss;gss',
      'G-code (ISO 6983);nc',
      'nc;nc',
      'Gherkin;gherkin',
      'GLSL;glsl',
      'GML;gml',
      'Go;go',
      'golang;go',
      'Golo;golo',
      'Gradle;gradle',
      'Groovy;groovy',
      'HAML;haml',
      'Handlebars;hbs',
      'hbs;hbs',
      'html.hbs;hbs',
      'html.handlebars;hbs',
      'Haskell;haskell',
      'hs;haskell',
      'Haxe;hx',
      'hx;hx',
      'HSP;hsp',
      'HTMLBars;htmlbars',
      'HTTP;https',
      'https;https',
      'Hy;hylang',
      'hylang;hylang',
      'Inform 7;i7',
      'i7;i7',
      'TOML, also INI;toml',
      'toml;toml',
      'ini;toml',
      'IRPF90;irpf90',
      'ISBL;isbl',
      'Java;java',
      'jsp;java',
      'JavaScript;js',
      'js;js',
      'jsx;js',
      'mjs;js',
      'cjs;js',
      'JBoss CLI;jbcli',
      'JSON;json',
      'Julia REPL;julia',
      'Julia;julia',
      'Kotlin;kt',
      'kt;kt',
      'Lasso;lasso',
      'ls;lasso',
      'lassoscript;lasso',
      'LaTeX;tex',
      'tex;tex',
      'LDIF;ldif',
      'Leaf;leaf',
      'Less;less',
      'Lisp;lisp',
      'LiveCode;livecode',
      'LiveScript;ls',
      'ls;ls',
      'LLVM IR;llvm ir',
      'LSL (Linden Scripting Language);lsl',
      'Lua;lua',
      'Makefile;make',
      'mk;make',
      'mak;make',
      'Markdown;md',
      'md;md',
      'mkdown;md',
      'mkd;md',
      'Mathematica;mma',
      'mma;mma',
      'wl;mma',
      'Matlab;matlab',
      'Maxima;maxima',
      'MEL;mel',
      'Mercury;m',
      'm;m',
      'moo;m',
      'MIPS Assembly;assembly',
      'mips;assembly',
      'Mizar;mizar',
      'Mojolicious;mojolicious',
      'Monkey;monkey',
      'MoonScript;moon',
      'moon;moon',
      'N1QL;n1ql',
      'Nginx config;nginx',
      'nginxconf;nginx',
      'nim;nim',
      'Nix;nixos',
      'nixos;nixos',
      'NSIS;nsis',
      'Objective-C;objc',
      'mm;objc',
      'objc;objc',
      'obj-c;objc',
      'OCaml;ocaml',
      'ml;ocaml',
      'OpenSCAD;scad',
      'scad;scad',
      'Oxygene;oxygene',
      'Parser3;parser3',
      'Perl;pl',
      'pl;pl',
      'pm;pl',
      'Packet Filter config;pf',
      'pf.conf;pf',
      'PostgreSQL;psql',
      'postgres;psql',
      'postgresql;psql',
      'PHP template;php',
      'php;php',
      'php3;php',
      'php4;php',
      'php5;php',
      'php6;php',
      'php7;php',
      'php8;php',
      'text;text',
      'txt;text',
      'Pony;pony',
      'PowerShell;ps',
      'ps;ps',
      'ps1;ps',
      'Processing;processing',
      'Python profiler;pyprofiler',
      'Prolog;prolog',
      '.properties;properties',
      'Protocol Buffers;protocolbuffers',
      'Puppet;pp',
      'pp;pp',
      'PureBASIC;pb',
      'pb;pb',
      'pbi;pb',
      'pycon;python',
      'Python;python',
      'py;python',
      'gyp;python',
      'ipython;python',
      'kdb;k',
      'QML;qt',
      'qt;qt',
      'ReasonML;re',
      're;re',
      'RenderMan RIB;rib',
      'Roboconf;graph',
      'graph;graph',
      'instances;graph',
      'Microtik RouterOS script;routeros',
      'routeros;routeros',
      'mikrotik;routeros',
      'RenderMan RSL;rsl',
      'Ruby;rb',
      'rb;rb',
      'gemspec;rb',
      'podspec;rb',
      'thor;rb',
      'irb;rb',
      'Oracle Rules Language;orl',
      'Rust;rust',
      'rs;rust',
      'SAS;sas',
      'Scala;scala',
      'Scheme;scheme',
      'Scilab;sci',
      'sci;sci',
      'SCSS;scss',
      'Shell Session;console',
      'console;console',
      'Smali;smali',
      'Smalltalk;st',
      'st;st',
      'SML (Standard ML);ocaml',
      'SQF;sqf',
      'SQL;sql',
      'Stan;stanfuncs',
      'stanfuncs;stanfuncs',
      'STEP Part 21;p21',
      'p21;p21',
      'step;p21',
      'stp;p21',
      'Stata;do',
      'ado;do',
      'do;do',
      'Stylus;styl',
      'styl;styl',
      'SubUnit;subunit',
      'Swift;swift',
      'Tagger Script;tagger',
      'Test Anything Protocol;tap',
      'Tcl;tk',
      'tk;tk',
      'Thrift;thrift',
      'TP;tp',
      'Twig;twig',
      'TypeScript;ts',
      'ts;ts',
      'Vala;vala',
      'Visual Basic .NET;vb',
      'vb;vb',
      'VBScript in HTML;vbs',
      'VBScript;vbs',
      'vbs;vbs',
      'Verilog;v',
      'sv;v',
      'svh;v',
      'VHDL;vhdl',
      'Vim Script;vim',
      'Intel x86 Assembly;assembly',
      'x86asm;assembly',
      'XL;tao',
      'tao;tao',
      'html;xml',
      'xml;xml',
      'xhtml;xml',
      'rss;xml',
      'atom;xml',
      'xjb;xml',
      'xsd;xml',
      'xsl;xml',
      'plist;xml',
      'wsf;xml',
      'svg;xml',
      'XQuery;xq',
      'xq;xq',
      'xpath;xq',
      'YAML;yml',
      'yml;yml',
      'zig;zig',
      'Zephir;zep',
      'zep;zep',
      'C;c',
      'h;c',
      'D;d',
      'Q;k',
      'k;k',
      'r;r',
      'v;v',
    ];

    let lang = '';
    const matches = [];
    for (let idx = 0; idx < supportedLanguagesKey.length; ++idx) {
      const [key, id] = supportedLanguagesKey[idx].split(';');
      if (codeContent.toLowerCase().startsWith(key.toLowerCase())) {
        startsWithLanguageTag = true;
        matches.push(id);
      }
    }
    if (matches.length > 1) {
      lang = matches.reduce(function(str, rts) {
        return str.length > rts.length ? str : rts;
      }, '');
    } else {
      lang = matches[0];
    }

    let codeAst = null;
    if (startsWithLanguageTag) {
      codeAst = parseMarkdown('code\n```' + codeContent + '\n```').children[1];
    } else {
      codeAst = parseMarkdown('code\n```\n' + codeContent + '\n```')
        .children[1];
    }
    const langFromAST = codeAst['lang'];
    if (lang == '') {
      lang = langFromAST;
    }

    return [lang, codeAst];
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
    // Check against REGEX.
    if (msg == null || msg['content'] == null) {
      return;
    }
    const msgContent = msg.content.trim();
    if (msgContent.match(this.regex) == null) {
      return;
    }

    // Check that Chi-Bot was pinged first.
    if (
      msg.mentions == null ||
      msg.mentions.users == null ||
      msg.mentions.users.first() == null
    ) {
      return;
    }
    if (msg.mentions.users.first().id != this.discord_client.user.id) {
      return;
    }

    // Check access.
    if (!this._enforceAccess(msg)) {
      return;
    }
    // Check timeout.
    if (!this._enforceTimeout(msg)) {
      return;
    }

    // Process.
    await this.onMsg(msg);
  }
}

module.exports = {
  Command: Command,
};
