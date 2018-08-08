'use strict';


module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const Logger = require(srcPath + 'Logger');

  return {
    usage: 'help [search] [topic keyword]',
	aliases: ['помощь' ],
    command: (state) => (args, player) => {
      if (!args.length) {
        // look at `help help` if they haven't specified a file
        return state.CommandManager.get('help').execute('help', player);
      }

      // `help search`
      if (args.indexOf('search') === 0 || args.indexOf('поиск') === 0) {
        return searchHelpfiles(args, player, state);
      }

      const hfile = state.HelpManager.get(args);

      if (!hfile) {
        Logger.error(`MISSING-HELP: [${args}]`);
        return B.sayAt(player, "Извините, но я не могу ничего подобного найти.");
      }
      try {
        B.sayAt(player, render(state, hfile));
      } catch (e) {
        Logger.warn(`UNRENDERABLE-HELP: [${args}]`);
        Logger.warn(e);
        B.sayAt(player, `Невалидный файл для ${args}.`);
      }
    }
  };

  function render(state, hfile) {
    let body = hfile.body;
    const name = hfile.name;

    const width = 80;
    const bar = B.line(width, '-', 'yellow') + '\r\n';

    let header = bar + B.center(width, name, 'white') + '\r\n' + bar;

    const formatHeaderItem = (item, value) => `${item}: ${value}\r\n\r\n`;
    if (hfile.command) {
      let actualCommand = state.CommandManager.get(hfile.command);

      header += formatHeaderItem('Синтаксис', actualCommand.usage);

      if (actualCommand.aliases && actualCommand.aliases.length > 0){
        header += formatHeaderItem('Синонимы', actualCommand.aliases.join(', '));
      }
    } else if (hfile.channel) {
      header += formatHeaderItem('Синтаксис', state.ChannelManager.get(hfile.channel).getUsage());
    }

    let footer = bar;
    if (hfile.related.length) {
      footer = B.center(width, 'RELATED', 'yellow', '-') + '\r\n';
      const related = hfile.related.join(', ');
      footer += B.center(width, related) + '\r\n';
      footer += bar;
    }

    return header + B.wrap(hfile.body, 80) + footer;
  }

  function searchHelpfiles(args, player, state) {
    args = args.split(' ').slice(1).join(' ');
    if (!args.length) {
      // `help search` syntax is included in `help help`
      return state.CommandManager.get('help').execute('help', player);
    }

    const results = state.HelpManager.find(args);
    if (!results.size) {
      return B.sayAt(player, "Простите, но никаких результатов по вашему запросу нет.");
    }
    if (results.size === 1) {
      const [ _, hfile ] = [...results][0];
      return B.sayAt(player, render(state, hfile));
    }
    B.sayAt(player, "<yellow>---------------------------------------------------------------------------------</yellow>");
    B.sayAt(player, "<white>Результаты поиска:</white>");
    B.sayAt(player, "<yellow>---------------------------------------------------------------------------------</yellow>");

    for (const [name, help] of results) {
      B.sayAt(player, `<cyan>${name}</cyan>`);
    }
  }

};
