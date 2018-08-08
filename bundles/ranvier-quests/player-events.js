'use strict';

module.exports = (srcPath) => {
  const B = require(srcPath + 'Broadcast');

  return  {
    listeners: {
      questStart: state => function (quest) {
        B.sayAt(this, `\r\n<bold><yellow>Задание начато: ${quest.config.title}!</yellow></bold>`);
        if (quest.config.description) {
          B.sayAt(this, B.line(80));
          B.sayAt(this, `<bold><yellow>${quest.config.description}</yellow></bold>`, 80);
        }

        if (quest.config.rewards.length) {
          B.sayAt(this);
          B.sayAt(this, '<b><yellow>' + B.center(80, 'Награды') + '</yellow></b>');
          B.sayAt(this, '<b><yellow>' + B.center(80, '-------') + '</yellow></b>');

          for (const reward of quest.config.rewards) {
            const rewardClass = state.QuestRewardManager.get(reward.type);
            B.sayAt(this, '  ' + rewardClass.display(state, quest, reward.config, this));
          }
        }

        B.sayAt(this, B.line(80));
      },

      questProgress: state => function (quest, progress) {
        B.sayAt(this, `\r\n<bold><yellow>${progress.display}</yellow></bold>`);
      },

      questTurnInReady: state => function (quest) {
        B.sayAt(this, `<bold><yellow>${quest.config.title} готово!</yellow></bold>`);
      },

      questComplete: state => function (quest) {
        B.sayAt(this, `<bold><yellow>Задание выполнено: ${quest.config.title}!</yellow></bold>`);

        if (quest.config.completionMessage) {
          B.sayAt(this, B.line(80));
          B.sayAt(this, quest.config.completionMessage);
        }
      },

      /**
       * Player received a quest reward
       * @param {object} reward Reward config _not_ an instance of QuestReward
       */
      questReward: state => function (reward) {
        // do stuff when the player receives a quest reward. Generally the Reward instance
        // will emit an event that will be handled elsewhere and display its own message
        // e.g., 'currency' or 'experience'. But if you want to handle that all in one
        // place instead, or you'd like to show some supplemental message you can do that here
      },
    }
  };
};

