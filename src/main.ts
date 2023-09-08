// imports
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Interaction,
  Message,
  SlashCommandBuilder,
} from "discord.js";
import { config as dotenvSetup } from "dotenv";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import fs from "node:fs";
import path from "node:path";

// data
const replies: Record<string, string> = {};

(async () => {
  // setup
  interface clientType extends Client {
    commands?: Collection<
      string,
      {
        data: SlashCommandBuilder;
        execute: (
          interaction: Interaction,
          db: Database<sqlite3.Database, sqlite3.Statement>,
          functions: Record<string, Function>,
        ) => void;
        autocomplete: (
          interaction: Interaction,
          db: Database<sqlite3.Database, sqlite3.Statement>,
        ) => void;
      }
    >;
  }

  const client: clientType = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  client.commands = new Collection();

  const dotenvResult = dotenvSetup();

  const db = await open({
    filename: "data.db",
    driver: sqlite3.Database,
  });

  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }

  // db handling
  sqlite3.verbose();

  await db.run(`
    create table if not exists replies (
      id integer not null primary key autoincrement,
      message text not null,
      reply text not null,
      unique(id, message)
    )
  `);

  const repliesResult = await db.all(`
    select * from replies
  `);

  for (let i = 0; i < repliesResult.length; i++) {
    const data = repliesResult[i];
    replies[data.message] = data.reply;
  }

  // functions
  const Functions: Record<string, Function> = {
    insertReply: (message: string, reply: string) => {
      replies[message] = reply;
    },
  };

  // main
  if (dotenvResult.error) {
    console.log("dotenv error", dotenvResult.error);
  } else {
    if (process.env.TOKEN) {
      client.on(Events.ClientReady, () => {
        if (client.user) {
          console.log(`[SUCCESS] Logged in as ${client.user.tag}!`);
        }
      });

      client.on(Events.MessageCreate, async (message: Message<boolean>) => {
        if (message.author.bot == false) {
          let found: undefined | string = undefined;

          for (const key in replies) {
            if (message.content.includes(key)) {
              found = replies[key];
            }
          }

          if (found) {
            message.reply(found);
          }
        }
      });

      client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        const client = interaction.client as clientType;
        if (client.commands && "commandName" in interaction) {
          const command = client.commands.get(interaction.commandName);

          if (!command) {
            console.error(
              `No command matching ${interaction.commandName} was found.`,
            );
            return;
          }

          try {
            if (interaction.isChatInputCommand()) {
              command.execute(interaction, db, Functions);
            } else if (interaction.isAutocomplete()) {
              await command.autocomplete(interaction, db);
            }
          } catch (error) {
            if ("reply" in interaction) {
              console.error("command error", error);
              interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
              });
            }
          }
        }
      });

      client.login(process.env.TOKEN).catch((err: string) => {
        console.error(
          "[CRASH] Something went wrong while connecting to your bot...",
        );
        console.error("[CRASH] Error from Discord API:" + err);
        return process.exit();
      });
    } else {
      console.log("invalid token");
    }
  }
})();
