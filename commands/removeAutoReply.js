const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeautoreply")
    .setDescription("Removes an auto reply")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("reply")
        .setRequired(true)
        .setDescription("The auto reply to remove")
        .setAutocomplete(true),
    ),
  async execute(interaction, db, functions) {
    const reply = interaction.options.getString("reply");

    const deleted = await db.run(
      `
        delete from replies where message = ?
      `,
      reply,
    );
    functions.removeReply(reply);

    if (deleted.changes == 1) {
      interaction.reply({
        ephemeral: true,
        content: "This auto reply was successfully deleted",
      });
    } else {
      interaction.reply({
        ephemeral: true,
        content: "Something went wrong whilst removing this auto response.",
      });
    }
  },
  autocomplete(interaction, _db, _functions, rawReplies) {
    const focusedValue = interaction.options.getFocused();

    const replies = [];

    for (const key in rawReplies) {
      replies.push({
        value: key,
        name: `${key} - ${rawReplies[key]}`,
      });
    }

    if (!focusedValue || focusedValue.trim().length == 0) {
      interaction.respond(replies);
      return;
    }

    const filtered = replies.filter(
      (choice) =>
        choice.value.includes(focusedValue) ||
        choice.name.includes(focusedValue),
    );

    interaction.respond(filtered);
  },
};
