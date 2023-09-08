const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoreplylist")
    .setDescription("displays all valid auto replies"),
  async execute(interaction, _db, _functions, rawReplies) {
    let msg = "Here are all valid auto replies:";

    for (const key in rawReplies) {
      msg += `\n**${key}** - ${rawReplies[key]}`;
    }

    interaction.reply({
      ephemeral: true,
      content: msg,
    });
  },
};
