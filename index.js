/**
 * Markov User Cloner (MUC or M.U.C)
 * (c) EuphoricPenguin, MIT License
 * v1.4.3 - working on fixing the all or everyone message receiving
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
            if (!msg.guild.member(id)) {
                let issue = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`*Huston, we have an ID problem.* Looks like that user doesn't exist (you probably made a typo). You can always ask for \`${config.prefix} help\``);
                msg.reply(issue);
                return;
            }
            let targetUser = await client.users.fetch(id);
            fetchMessages(targetUser)
                .then(msgs => {
                    if (invalidUserCheck(msgs)) return;
                    guildsObj[guild] = {
                        chain: new Markov(),
                        user: targetUser
                    }
                    console.log(`cloning ${guildsObj[guild].user.tag} in ${client.guilds.cache.get(guild).name}`);
                    msgs.forEach(msg => {
                        guildsObj[guild].chain.update(msg);
                    });
                    let clone = new Discord.MessageEmbed()
                        .setColor("#000000")
                        .setAuthor(`${guildsObj[guild].user.tag} might say:`, guildsObj[guild].user.displayAvatarURL())
                        .setDescription(`\`\`\`${guildsObj[guild].chain.generate()}\`\`\``);
                    msg.channel.send(clone);
                });
        },
        "regen": async function () {
            if (guild in guildsObj) {
                console.log(`regenerating ${guildsObj[guild].user.tag} in ${guild}`);
                let regen = new Discord.MessageEmbed()
                    .setColor("#FFFFFF")
                    .setAuthor(`${guildsObj[guild].user.tag} also might say:`, guildsObj[guild].user.displayAvatarURL())
                    .setDescription(`\`\`\`${guildsObj[guild].chain.generate()}\`\`\``);
                msg.channel.send(regen);
            } else {
                let issue = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`use \`${config.prefix} regen\` only after using \`${config.prefix} clone.\``);
                msg.reply(issue);
            }
        },
        "help": async function () {
            let help = new Discord.MessageEmbed()
                .setColor("#0099E1")
                .addFields({
                    name: "Commands:", value: `Use \`${config.prefix} clone @user\` to clone someone.
                If you want to re-generate a new message, use \`${config.prefix} regen\`.`
                },
                    {
                        name: "Tidbits:", value: `
                    Uptime: **${await fetchUptime()}**
                    Guild ratio: ${Object.keys(guildsObj).length} (active)/**${client.guilds.cache.size} (total)** *(${Object.keys(guildsObj).length/client.guilds.cache.size})*`
                    })
                .setFooter(config.helpFooter, client.user.displayAvatarURL());
            msg.channel.send(help);
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

    async function fetchMessages(user) {
        let output = await msg.channel.messages.fetch({ limit: 100 });
        output = output.map(m => {
            if (!m.author.bot && (m.author.id === user.id)) {
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
            let issue = new Discord.MessageEmbed()
                .setColor("#F93A2F")
                .setAuthor("Error:")
                .setDescription(`*Huston, we can't see anything.* Looks like that user hasn't sent any plain-text messages.`);
            msg.reply(issue);
            return true;
        }
    }

    if (!commandIntp(commandArr, false)) {
        let issue = new Discord.MessageEmbed()
            .setColor("#F93A2F")
            .setAuthor("Error:")
            .setDescription(`*Huston, we have an invalid command.* You can always ask for \`${config.prefix} help\``);
        msg.reply(issue);

    } else {
        commandIntp(commandArr, true);
    }
});

client.on("error", console.error);

client.login(process.env.TOKEN);