'use strict';

module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    usage: 'падежи',
    aliases: ['падежи'],
    command: state => (args, player, arg0) => {
      if (!args) {
        Broadcast.sayAt(player, '<b>Падежи:</b>');
        for (var x = 0; x < 6 ; x++ )
        {
          Broadcast.sayAt(player, '<b>:</b>');
          Broadcast.sayAt(player, `(${player.getCase(x)})`);
        }
        
        
      }
      
    }
  };
};