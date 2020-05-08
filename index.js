/**
 * Markov User Cloner (MUC or M.U.C)
 * (c) EuphoricPenguin, MIT License
 * v1.3.0
 */
require("dotenv").config();
const config = require("./config.json");

const Markov = require("purpl-markov-chain");

const Discord = require("discord.js");
const client = new Discord.Client();

let guildsObj = {};

client.on("ready", () => {
    console.log(`MUC logged in as: ${client.user.tag}`);
    client.user.setActivity(`for ${config.prefix} help`, { type: "WATCHING" })
        .catch(console.error);
});

client.on("message", msg => {
    if (msg.author.bot) return;
    if (msg.guild === null || !(msg.content.startsWith(config.prefix))) return;
    let command = msg.content.substring(config.prefix.length);
    let commandArr = command.split(" ").filter(i => i !== "");

    //Strips mentions down to user id's
    if (commandArr.length > 1 && commandArr[1].includes("<@!")) {
        commandArr[1] = commandArr[1].substring(3, commandArr[1].length - 1);
    }

    let guild = msg.guild.id;
    const commandsObj = {
        "clone": async function (id) {
            fetchMessages(id)
                .then(msgs => {
                    if (invalidUserCheck(msgs)) return;
                    guildsObj[guild] = new Markov();
                    console.log(`cloning ${id} in ${guild}`);
                    msgs.forEach(msg => {
                        guildsObj[guild].update(msg);
                    });
                    if (id === "all") {
                        let embed = new Discord.MessageEmbed()
                            .setColor("#000000")
                            .setAuthor("Everyone might say:", "https://raw.githubusercontent.com/EuphoricPenguin/MUC/master/media/MUC.png")
                            .setDescription(`\`\`\`${guildsObj[guild].generate()}\`\`\``);
                        msg.channel.send(embed);
                    } else {
                        let embed = new Discord.MessageEmbed()
                            .setColor("#000000")
                            .setAuthor(`${id} might say:`, "https://raw.githubusercontent.com/EuphoricPenguin/MUC/master/media/MUC.png")
                            .setDescription(`\`\`\`${guildsObj[guild].generate()}\`\`\``);
                        msg.channel.send(embed);
                    }
                });
        },
        "regen": async function () {
            if (guild in guildsObj) {
                console.log(`regenerating in ${guild}`);
                let embed = new Discord.MessageEmbed()
                    .setColor("#FFFFFF")
                    .setAuthor("They also might say:", "https://raw.githubusercontent.com/EuphoricPenguin/MUC/master/media/MUC.png")
                    .setDescription(`\`\`\`${guildsObj[guild].generate()}\`\`\``);
                msg.channel.send(embed);
            } else {
                let embed = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`use \`${config.prefix} regen\` only after using \`${config.prefix} clone.\``);
                msg.reply(embed);
            }
        },
        "help": async function () {
            let embed = new Discord.MessageEmbed()
                .setColor("#0099E1")
                .setAuthor(config.helpIntro)
                .setDescription(`
Use \`${config.prefix} clone @user\` to clone anyone, or use \`all\` instead (no @) to clone everyone.
If you want to re-generate a new message, use \`${config.prefix} regen\`.
*The bot only uses the last 100 messages or so sent in the server, so keep this in mind.*
**Here's some fun facts about this bot:**
*Uptime:* ***${await fetchUptime()}***
*Since it was last started, this bot has saw active use in ${Object.keys(guildsObj).length} guild(s).*`);
            msg.author.send(embed);
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

    async function fetchUptime() {
        return `${Math.floor(client.uptime / 86400000)} day(s), ${Math.floor(client.uptime / 3600000)} hour(s)`;
    }

    function invalidUserCheck(msgs) {
        if (msgs.length < 1) {
            let embed = new Discord.MessageEmbed()
                .setColor("#F93A2F")
                .setAuthor("Error:")
                .setDescription(`*Huston, we have an ID problem.* Looks like you might've had a typo, or the user hasn't sent any plain-text messages. You can always ask for \`${config.prefix} help\``);
            msg.reply(embed);
            return true;
        }
    }

    if (!commandIntp(commandArr, false)) {
        let embed = new Discord.MessageEmbed()
            .setColor("#F93A2F")
            .setAuthor("Error:")
            .setDescription(`*Huston, we have an invalid command.* You can always ask for \`${config.prefix} help\``);
        msg.reply(embed);

    } else {
        commandIntp(commandArr, true);
    }
});

client.on("error", console.error);

client.login(process.env.TOKEN);