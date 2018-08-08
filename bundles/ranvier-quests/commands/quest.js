'use strict';

module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');
  const say = B.sayAt;
  const Parser = require(srcPath + 'CommandParser').CommandParser;
  const CommandManager = require(srcPath + 'CommandManager');

  const subcommands = new CommandManager();
  subcommands.add({
    name: 'list',
	aliases: ['спиоск'],
    command: state => (options, player) => {
      if (!options.length) {
        return say(player, "Список заданий от кого? задания список <НПЦ>");
      }

      const search = options[0];
      const npc = Parser.parseDot(search, player.room.npcs);
      if (!npc) {
        return say(player, `Квесторов [${search}] не найдено.`);
      }

      if (!npc.quests) {
        return say(player, `${npc.name} не дает заданий.`);
      }

      let availableQuests = getAvailableQuests(state, player, npc);

      if (!availableQuests.length) {
        return say(player, `${npc.name} не имеет заданий.`);
      }

      for (let i in availableQuests) {
        let quest = availableQuests[i];
        let qref = quest.entityReference;
        const displayIndex = parseInt(i, 10) + 1;
        if (player.questTracker.canStart(quest)) {
          say(player, `[<b><yellow>!</yellow></b>] - ${displayIndex}. ${quest.config.title}`);
        } else if (player.questTracker.isActive(qref)) {
          quest = player.questTracker.get(qref);
          const symbol = quest.getProgress().percent >= 100 ? '?' : '%';
          say(player, `[<b><yellow>${symbol}</yellow></b>] - ${displayIndex}. ${quest.config.title}`);
        }
      }
    }
  });

  subcommands.add({
    name: 'начать',
    aliases: [ 'accept, принять, start' ],
    command: state => (options, player) => {
      if (options.length < 2) {
        return say(player, "Принять какое задание и от кого? 'задание начать <нпц> <номер>'");
      }

      let [search, questIndex] = options;
      questIndex = parseInt(questIndex, 10);

      const npc = Parser.parseDot(search, player.room.npcs);
      if (!npc) {
        return say(player, `Квесторов [${search}] не найдено.`);
      }

      if (!npc.quests || !npc.quests.length) {
        return say(player, `${npc.name} не имеет заданий.`);
      }

      if (isNaN(questIndex) || questIndex < 0 || questIndex > npc.quests.length) {
        return say(player, `Неправильное задание, используйте 'задание список ${search}' чтобы увидеть их задания.`);
      }

      let availableQuests = getAvailableQuests(state, player, npc);

      const targetQuest = availableQuests[questIndex - 1];

      if (player.questTracker.isActive(targetQuest.entityReference)) {
        return say(player, "Вы уже начали это задание. Use 'quest log' to see your active quests.");
      }

      player.questTracker.start(targetQuest);
      player.save();
    }
  });

  subcommands.add({
    name: 'журнал',
    command: state => (options, player) => {
      const active = [...player.questTracker.activeQuests];
      if (!active.length) {
        return say(player, "У вас нет активных заданий.");
      }

      for (let i in active) {
        const [, quest] = active[i];
        const progress = quest.getProgress();

        B.at(player, '<b><yellow>' + (parseInt(i, 10) + 1) + '</yellow></b>: ');
        say(player, B.progress(60, progress.percent, 'yellow') + ` ${progress.percent}%`);
        say(player, B.indent('<b><yellow>' + quest.getProgress().display + '</yellow></b>', 2));

        if (quest.config.npc) {
          const npc = state.MobFactory.getDefinition(quest.config.npc);
          say(player, `  <b><yellow>Заданиедатель: ${npc.name}</yellow></b>`);
        }

        say(player, '  ' + B.line(78));
        say(
          player,
          B.indent(
            B.wrap(`<b><yellow>${quest.config.description}</yellow></b>`, 78),
            2
          )
        );

        if (quest.config.rewards.length) {
          say(player);
          say(player, '<b><yellow>' + B.center(80, 'Награды') + '</yellow></b>');
          say(player, '<b><yellow>' + B.center(80, '-------') + '</yellow></b>');

          for (const reward of quest.config.rewards) {
            const rewardClass = state.QuestRewardManager.get(reward.type);
            say(player, '  ' + rewardClass.display(state, quest, reward.config, player));
          }
        }

        say(player, '  ' + B.line(78));
      }
    }
  });

  subcommands.add({
    name: 'выполнить',
    command: (state) => (options, player) => {
      const active = [...player.questTracker.activeQuests];
      let targetQuest = parseInt(options[0], 10);
      targetQuest = isNaN(targetQuest) ? -1 : targetQuest - 1;
      if (!active[targetQuest]) {
        return say(player, "Неправильное задание, используйте 'задание журнал' чтобы увидеть ваши активные задания.");
      }

      const [, quest ] = active[targetQuest];

      if (quest.getProgress().percent < 100) {
        say(player, `${quest.config.title} ещё не выполнено.`);
        quest.emit('progress', quest.getProgress());
        return;
      }

      if (quest.config.npc && ![...player.room.npcs].find((npc) => npc.entityReference === quest.config.npc)) {
        const npc = state.MobFactory.getDefinition(quest.config.npc);
        return say(player, `Заданиедатель [${npc.name}] не в этой комнате.`);
      }

      quest.complete();
      player.save();
    }
  });

  return {
    usage: 'задание <журнал/список/выполнить/начать> [НПЦ] [номер]',
	aliases: ['задание'],
    command : (state) => (args, player) => {
      if (!args.length) {
        return say(player, "Отсутствует команда. Введите 'помощь задание'");
      }

      const [ command, ...options ] = args.split(' ');

      const subcommand = subcommands.find(command);
      if (!subcommand) {
        return say(player, "Неправильная команда. Введите 'помощь задание'");
      }

      subcommand.command(state)(options, player);
    }
  };
};

function getAvailableQuests(state, player, npc) {
  return npc.quests
    .map(qid => state.QuestFactory.create(state, qid, player))
    .filter(quest => {
        const qref = quest.entityReference;
        return player.questTracker.canStart(quest) || player.questTracker.isActive(qref);
    })
  ;
}
