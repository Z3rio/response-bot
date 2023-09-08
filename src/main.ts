// imports
import { Client, GatewayIntentBits, Message } from "discord.js";
import { config as dotenvSetup } from "dotenv";

// data
const replies: Record<string, string> = {};

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
const result = dotenvSetup();

// main
if (result.error) {
  console.log("dotenv error", result.error);
} else {
  if (process.env.TOKEN) {
    client.on("ready", () => {
      if (client.user) {
        console.log(`[SUCCESS] Logged in as ${client.user.tag}!`);
      }
    });

    client.on("messageCreate", async (message: Message<boolean>) => {
      let found: undefined | string = undefined;

      for (const key in replies) {
        if (message.content.includes(key)) {
          found = replies[key];
        }
      }

      if (found) {
        message.reply(found);
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
