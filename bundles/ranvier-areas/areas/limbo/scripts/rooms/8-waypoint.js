'use strict';

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return  {
    listeners: {
      playerEnter: state => function (player) {
        Broadcast.sayAt(player);          
        Broadcast.sayAt(player, `<b><cyan>Подсказка: С помощью вейпоинтов можно путешествовать на большие расстояние. Сохраните текущую позицию командой <white>вейпоинт сохранить</white>. Так же можно установить точку возврата командой <white>вейпоинт дом</white>, на которую можно будет переместиться командой <white>возврат</white></cyan></b>`, 80);
      }
    }
  };
};
