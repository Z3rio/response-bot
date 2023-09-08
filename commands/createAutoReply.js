const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createautoreply")
    .setDescription("Creates a new auto reply")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("text").setRequired(true).setDescription("Text to match"),
    )
    .addStringOption((option) =>
      option
        .setName("reply")
        .setRequired(true)
        .setDescription("Text to reply with"),
    ),
  async execute(interaction, db, functions) {
    const text = interaction.options.getString("text");
    const reply = interaction.options.getString("reply");

    const alreadyExists = await db.get(
      `
        select count(1) from replies where message = ?
      `,
      text,
    );

    if (alreadyExists["count(1)"] == 0) {
      const resp = await db.run(
        `
          insert into replies (message, reply) values (?, ?)
        `,
        text,
        reply,
      );

      if (resp.changes == 1) {
        functions.insertReply(text, reply);

        interaction.reply({
          ephemeral: true,
          content: "This auto reply has been successfully created",
        });
      } else {
        interaction.reply({
          ephemeral: true,
          content: "Something went wrong whilst creating this auto response.",
        });
      }
    } else {
      interaction.reply({
        content: "There is already an auto response for that phrase",
        ephemeral: true,
      });
    }
  },
};
