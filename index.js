/**
 * Markov User Cloner (MUC or M.U.C)
 * (C) EuphoricPenguin, MIT License
 * v1.1.2
 */
require("dotenv").config();
const config = require("./config.json");

const Markov = require("purpl-markov-chain");

const Discord = require("discord.js");
const client = new Discord.Client();

let guildsObj = {};

client.on("ready", () => {
    console.log(`MUC logged in as: ${client.user.tag}`);
    client.user.setActivity(config.status, { type: "WATCHING" })
        .catch(console.error);
});

client.on("message", msg => {
    if (msg.author.bot) return;
    if (msg.guild === null || !(msg.content.indexOf(config.prefix) === 0)) return;

    let command = msg.content.substring(1);
    let commandArr = command.split(" ");
    let guild = msg.guild.id;
    const commandsObj = {
        "clone": async function (id) {
            console.log(`cloning ${id} in ${guild}`);
            guildsObj[guild] = new Markov();
            fetchMessages(id)
                .then(msgs => {
                    msgs.forEach(msg => {
                        guildsObj[guild].update(msg);
                    });
                    if (id === "all") {
                        msg.channel.send(`\`everyone\` might say:
                            \`\`\`${guildsObj[guild].generate()}\`\`\``);
                    } else {
                        msg.channel.send(`\`${id}\` might say:
                            \`\`\`${guildsObj[guild].generate()}\`\`\``);
                    }
                });
        },
        "regen": async function () {
            if (guild in guildsObj) {
                console.log(`regenerating in ${guild}`);
                msg.channel.send(`They also might say:
                    \`\`\`${guildsObj[guild].generate()}\`\`\``);
            } else {
                msg.reply(`use \`${config.prefix}regen\` only after using \`${config.prefix}clone.\``);
            }
        },
        "help": async function () {
            msg.author.send(config.helpIntro +
                `
Use \`${config.prefix}clone <id>\` to clone anyone, or use \`all\` instead to clone everyone.
If you want to re-generate a new message, use \`${config.prefix}regen\`.
*The bot only uses the last 100 messages or so sent in the server, so keep this in mind.*

**Here's some fun facts about this bot:**
*Uptime: ${fetchUptime()}*
*Since it was last started, this bot has saw active use in ${Object.keys(guildsObj).length} guild(s).*`);
            msg.reply("I sent you a DM with usage information.");
        }
    }

    function commandIntp(commandArr, exec) {
        let foundKey = false;
        let commandObjKeys = Object.keys(commandsObj);
        commandObjKeys.forEach(key => {
            if (commandArr[0] === key && exec) {
                msg.channel.startTyping();
                commandsObj[commandArr[0]](commandArr[1])
                    .then(() => {
                        msg.channel.stopTyping();
                    });
            } else if (commandArr[0] === key) {
                foundKey = true;
            }
        });
        return foundKey;
    }

    async function fetchMessages(id) {
        let output = await msg.channel.messages.fetch({ limit: 100 });
        output = output.map(m => {
            if (!m.author.bot && (m.author.id === id || id === "all")) {
                return m.content;
            }
        });
        return output.filter(m => m != undefined);
    }

    function fetchUptime() {
        let miliseconds = client.uptime;
        let seconds = Math.round(miliseconds / 1000) % 60;
        let minutes = Math.round((seconds / 60) % 60);
        let hours = Math.round((minutes / 60) % 24);
        let days = Math.round(hours / 24);
        return `(D)${days}:(H)${hours}:(M)${minutes}:(S)${seconds}`;
    }

    if (!commandIntp(commandArr, false)) {
        msg.reply(`Invalid command. You can always ask for \`${config.prefix}help\``);
    } else {
        commandIntp(commandArr, true);
    }
});

client.on("error", console.error);

client.login(process.env.TOKEN);