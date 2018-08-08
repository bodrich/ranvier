'use strict';

module.exports = (srcPath) => {
  const WorldAudience = require(srcPath + 'ChannelAudience/WorldAudience');
  const AreaAudience = require(srcPath + 'ChannelAudience/AreaAudience');
  const RoomAudience = require(srcPath + 'ChannelAudience/RoomAudience');
  const PrivateAudience = require(srcPath + 'ChannelAudience/PrivateAudience');
  const PartyAudience = require(srcPath + 'ChannelAudience/PartyAudience');
  const Channel = require(srcPath + 'Channel');

  return [
    new Channel({
      name: 'ooc',
      aliases: ['.', 'say'],
      color: ['bold', 'green'],
      description: 'Чат со всеми в игре.',
      audience: new WorldAudience()
    }),

    new Channel({
      name: 'болтать',
	  aliases: ['say'],
      color: ['yellow'],
      description: 'Чат со всеми в вашей комнате',
      audience: new RoomAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`Вы сказали: '${message}'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} говорит: '${message}'`);
        }
      }
    }),

    new Channel({
      name: 'шептать',
	  aliases: ['tell'],
      color: ['bold', 'cyan'],
      description: 'Приватное сообщение другому игроку. ',
      audience: new PrivateAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`Вы шепчите ${target.name}, '${message}'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} шепчет вам, '${message}'`);
        }
      }
    }),

    new Channel({
      name: 'кричать',
	  aliases: ['yell'],
      color: ['bold', 'red'],
      description: 'Отправить сообщение всем в локации.',
      audience: new AreaAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`Вы кричите, '${message}'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`Кто-то кричит рядом, '${message}'`);
        }
      }
    }),

    new Channel({
      name: 'пшептать',
	  aliases: ['qtell'],
      color: ['bold', 'green'],
      description: 'Отправить сообщение всем сопартийцам, где бы они не были. ',
      audience: new PartyAudience(),
      formatter: {
        sender: function (sender, target, message, colorify) {
          return colorify(`Вы шепчите группе, '${message}'`);
        },

        target: function (sender, target, message, colorify) {
          return colorify(`${sender.name} шепчет группе, '${message}'`);
        }
      }
    }),
  ];
};
