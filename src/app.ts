import { Client } from 'discord.js';

const client = new Client({
  intents: ['Guilds', 'GuildMembers'],
});

export default client;
