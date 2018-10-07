'use strict';

module.exports = (srcPath) => {
  const Broadcast = require(srcPath + 'Broadcast');

  return  {
    listeners: {
      command: state => function (player, commandName, args) {
        Broadcast.sayAt(player, `Вы набрали команду '${commandName}' с аргументами ${args}`);
      }
    }
  };
};
