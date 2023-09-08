import { Client, GatewayIntentBits } from "discord.js";
import { config as dotenvSetup } from "dotenv";
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const result = dotenvSetup();

if (result.error) {
  console.log("dotenv error", result.error);
} else {
  if (process.env.TOKEN) {
    client.on("ready", () => {
      if (client.user) {
        console.log(`Logged in as ${client.user.tag}!`);
      }
    });

    client.login(process.env.TOKEN);
  } else {
    console.log("invalid token");
  }
}
