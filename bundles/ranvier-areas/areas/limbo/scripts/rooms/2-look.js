'use strict';

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return  {
    listeners: {
      playerEnter: state => function (player) {
        Broadcast.sayAt(player);
        Broadcast.sayAt(player, `<b><cyan>Подсказка: Вы можете подобрать предметы, которые видите по команде '<white>смотреть</white>'`, 80);
      }
    }
  };
};
