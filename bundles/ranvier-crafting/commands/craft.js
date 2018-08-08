'use strict';

const sprintf = require('sprintf-js').sprintf;

module.exports = (srcPath, bundlePath) => {
  const B = require(srcPath + 'Broadcast');
  const say = B.sayAt;
  const CommandManager = require(srcPath + 'CommandManager');
  const ItemType = require(srcPath + 'ItemType');
  const Crafting = require(bundlePath + 'ranvier-crafting/lib/Crafting');
  const ItemUtil = require(bundlePath + 'ranvier-lib/lib/ItemUtil');

  const subcommands = new CommandManager();

  /** LIST **/
  subcommands.add({
    name: 'list',
    command: state => (args, player) => {
      const craftingCategories = getCraftingCategories(state);

      // list categories
      if (!args || !args.length) {
        say(player, '<b>Crafting Categories</b>');
        say(player, B.line(40));

        return craftingCategories.forEach((category, index) => {
          say(player, sprintf('%2d) %s', parseInt(index, 10) + 1, craftingCategories[index].title));
        });
      }

      let [itemCategory, itemNumber] = args.split(' ');

      itemCategory = parseInt(itemCategory, 10) - 1;
      const category = craftingCategories[itemCategory];
      if (!category) {
        return say(player, "Неверная категория.");
      }

      // list items within a category
      if (!itemNumber) {
        say(player, `<b>${category.title}</b>`);
        say(player, B.line(40));

        if (!category.items.length) {
          return say(player, B.center(40, "Нет рецептов."));
        }

        return category.items.forEach((categoryEntry, index) => {
          say(player, sprintf('%2d) ', index + 1) + ItemUtil.display(categoryEntry.item));
        });
      }

      itemNumber = parseInt(itemNumber, 10) - 1;
      const item = category.items[itemNumber];
      if (!item) {
        return say(player, "Неправильный предмет.");
      }

      say(player, ItemUtil.renderItem(state, item.item, player));
      say(player, '<b>Рецепты:</b>');
      for (const [resource, amount] of Object.entries(item.recipe)) {
        const ingredient = Crafting.getResourceItem(resource);
        say(player, `  ${ItemUtil.display(ingredient)} x ${amount}`);
      }
    }
  });

  /** CREATE **/
  subcommands.add({
    name: 'create',
    command: state => (args, player) => {
      if (!args || !args.length) {
        return say(player, "Create what? 'craft create 1 1' for example.");
      }

      const isInvalidSelection = categoryList => category =>
        isNaN(category) || category < 0 || category > categoryList.length;

      const craftingCategories = getCraftingCategories(state);
      const isInvalidCraftingCategory = isInvalidSelection(craftingCategories);

      let [itemCategory, itemNumber] = args.split(' ');

      itemCategory = parseInt(itemCategory, 10) - 1;
      if (isInvalidCraftingCategory(itemCategory)) {
        return say(player, "Неправильная категория.");
      }

      const category = craftingCategories[itemCategory];
      const isInvalidCraftableItem = isInvalidSelection(category.items);
      itemNumber = parseInt(itemNumber, 10) - 1;
      if (isInvalidCraftableItem(itemNumber)) {
        return say(player, "Неправильный предмет.");
      }

      const item = category.items[itemNumber];
      // check to see if player has resources available
      for (const [resource, recipeRequirement] of Object.entries(item.recipe)) {
        const playerResource = player.getMeta(`resources.${resource}`) || 0;
        if (playerResource < recipeRequirement) {
          return say(player, `У вас недостаточно ресурсов. 'craft list ${args}' чтобы увидеть рецепты. Вам надо ${recipeRequirement - playerResource} ${resource}.`);
        }
      }

      if (player.isInventoryFull()) {
        return say(player, "Вы не удержите больше предметов.");
      }

      // deduct resources
      for (const [resource, amount] of Object.entries(item.recipe)) {
        player.setMeta(`resources.${resource}`, player.getMeta(`resources.${resource}`) - amount);
        const resItem = Crafting.getResourceItem(resource);
        say(player, `<green>Вы использовали ${amount} x ${ItemUtil.display(resItem)}.</green>`);
      }

      state.ItemManager.add(item.item);
      player.addItem(item.item);
      say(player, `<b><green>Вы создали: ${ItemUtil.display(item.item)}.</green></b>`);
      player.save();
    }
  });

  function getCraftingCategories(state) {
    let craftingCategories = [
      {
        type: ItemType.POTION,
        title: "Зелья",
        items: []
      },
      {
        type: ItemType.WEAPON,
        title: "Оружие",
        items: []
      },
      {
        type: ItemType.ARMOR,
        title: "Броня",
        items: []
      },
    ];

    const recipes = Crafting.getRecipes();
    for (const recipe of recipes) {
      const recipeItem = state.ItemFactory.create(
        state.AreaManager.getAreaByReference(recipe.item),
        recipe.item
      );

      const catIndex = craftingCategories.findIndex(cat => {
        return cat.type === recipeItem.type;
      });

      if (catIndex === -1) {
        continue;
      }

    recipeItem.hydrate(state);
      craftingCategories[catIndex].items.push({
        item: recipeItem,
        recipe: recipe.recipe
      });
    }

    return craftingCategories;
  }

  return {
    usage: 'craft <list/create> [category #] [item #]',
    command: state => (args, player) => {
      if (!args.length) {
        return say(player, "Отсутствует команда крафта. Введите 'help craft'");
      }

      const [ command, ...subArgs ] = args.split(' ');

      const subcommand = subcommands.find(command);
      if (!subcommand) {
        return say(player, "Отсутствует команда. Используйте 'craft list' или 'craft create'.");
      }

      subcommand.command(state)(subArgs.join(' '), player);
    }
  };
};
