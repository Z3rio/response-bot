// imports
import { Client, GatewayIntentBits, Message } from "discord.js";
import { config as dotenvSetup } from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// data
const replies: Record<string, string> = {};

(async () => {
  // setup
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  const dotenvResult = dotenvSetup();

  const db = await open({
    filename: "data.db",
    driver: sqlite3.Database,
  });

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

  // main
  if (dotenvResult.error) {
    console.log("dotenv error", dotenvResult.error);
  } else {
    if (process.env.TOKEN) {
      client.on("ready", () => {
        if (client.user) {
          console.log(`[SUCCESS] Logged in as ${client.user.tag}!`);
        }
      });

      client.on("messageCreate", async (message: Message<boolean>) => {
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
