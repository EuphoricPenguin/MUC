/**
 * Markov User Cloner (MUC or M.U.C)
 * (c) EuphoricPenguin, MIT License
 * v1.6.2 - working on fixing the all or everyone message receiving
 */
require("dotenv").config();
const config = require("./config.json");

const Markov = require("js-markov");
const Moment = require("moment");

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

    let guild = msg.guild.id;
    if (!(guild in guildsObj)) guildsObj[guild] = {};
    if (!("prefix" in guildsObj[guild])) guildsObj[guild].prefix = config.prefix;
    if (!("order" in guildsObj[guild])) guildsObj[guild].order = config.order;
    if (!("length" in guildsObj[guild])) guildsObj[guild].length = 0;

    if (!msg.guild || !(msg.content.startsWith(guildsObj[guild].prefix))) return;
    let command = msg.content.substring(guildsObj[guild].prefix.length);
    let commandArr = command.split(" ").filter(i => i !== "");

    //Strips mentions down to user id's
    if (commandArr.length > 1 && commandArr[1].includes("<@!")) {
        commandArr[1] = commandArr[1].substring(3, commandArr[1].length - 1);
    }

    const commandsObj = {
        "clone": async function (id) {
            if (!msg.guild.member(id)) {
                let issue = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`*Huston, we have an ID problem.* Looks like that user doesn't exist (you probably made a typo). You can always ask for \`${guildsObj[guild].prefix} help\``);
                msg.reply(issue);
                return;
            }
            let targetUser = await client.users.fetch(id);
            fetchMessages(targetUser)
                .then(msgs => {
                    if (invalidUserCheck(msgs)) return;
                    guildsObj[guild].chain = new Markov();
                    guildsObj[guild].user = targetUser;
                    guildsObj[guild].msgCnt = msgs.length;
                    console.log(`cloning ${guildsObj[guild].user.tag} in ${client.guilds.cache.get(guild).name}`);
                    guildsObj[guild].chain.addStates(msgs);
                    let meanLength = 0;
                    msgs.forEach(m => meanLength += m.length);
                    meanLength /= msgs.length;
                    guildsObj[guild].length = Math.round(meanLength);
                    guildsObj[guild].chain.train(guildsObj[guild].order);
                    let clone = new Discord.MessageEmbed()
                        .setColor("#FFFFFF")
                        .setAuthor(`${guildsObj[guild].user.tag} might say:`, guildsObj[guild].user.displayAvatarURL())
                        .setDescription(`\`\`\`${guildsObj[guild].chain.generateRandom(guildsObj[guild].length)}\`\`\``)
                        .setFooter(`M: ${guildsObj[guild].msgCnt} O: ${guildsObj[guild].order} L: ${guildsObj[guild].length}`);
                    msg.channel.send(clone);
                });
        },
        "regen": async function () {
            if (guildsObj[guild].user !== undefined) {
                console.log(`regenerating ${guildsObj[guild].user.tag} in ${client.guilds.cache.get(guild).name}`);
                let regen = new Discord.MessageEmbed()
                    .setColor("#FFFFFF")
                    .setAuthor(`${guildsObj[guild].user.tag} also might say:`, guildsObj[guild].user.displayAvatarURL())
                    .setDescription(`\`\`\`${guildsObj[guild].chain.generateRandom(guildsObj[guild].length)}\`\`\``)
                    .setFooter(`M: ${guildsObj[guild].msgCnt} O: ${guildsObj[guild].order} L: ${guildsObj[guild].length}`);
                msg.channel.send(regen);
            } else {
                let issue = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`use \`${guildsObj[guild].prefix} regen\` only after using \`${guildsObj[guild].prefix} clone\`.`);
                msg.reply(issue);
            }
        },
        "prefix": async function (newPrefix) {
            if (!(guildsObj[guild].prefix === newPrefix) && msg.member.hasPermission(config.prefixPerm)) {
                guildsObj[guild].prefix = newPrefix;
                let prefixChange = new Discord.MessageEmbed()
                    .setColor("#0099E1")
                    .setDescription(`Prefix changed to \`${guildsObj[guild].prefix}\``);
                return msg.channel.send(prefixChange);
            } else {
                let issue = new Discord.MessageEmbed()
                    .setColor("#F93A2F")
                    .setAuthor("Error:")
                    .setDescription(`Either you don't have the \`${config.prefixPerm}\` *(or admin/owner)* permission, or the prefix is the same.`);
                return msg.reply(issue);
            }
        },
        "help": async function () {
            let help = new Discord.MessageEmbed()
                .setColor("#0099E1")
                .addFields({
                    name: "Commands:", value:
                        `Use \`${guildsObj[guild].prefix} clone @user\` to clone someone.
If you want to re-generate a new message, use \`${guildsObj[guild].prefix} regen\`.
You can change this bot's prefix with \`${guildsObj[guild].prefix} prefix <string>\` (if you have the \`${config.prefixPerm}\` perm).`
                },
                {name: "Other:", value:
            `The new clone/regen footer allows for a quick glance at generation metrics:
\`M:\` - Shows the number of messages that were used to generate the chain.
\`O:\` - The markov chain [order](https://qr.ae/pNK5KG) used.
\`L:\` - The maximum length for generated messages.`
        },
                    {
                        name: "Tidbits:", value:
                            `Uptime: **${await fetchUptime()}**
Guild ratio: ${Object.keys(guildsObj).length} (active)/**${client.guilds.cache.size} (total)** *(${Object.keys(guildsObj).length / client.guilds.cache.size})*`
                    })
                .setFooter(config.helpFooter, "https://raw.githubusercontent.com/EuphoricPenguin/MUC/master/media/ep-icon.png");
            msg.channel.send(help);
        }
    }

    function commandIntp(commandArr, exec) {
        let foundKey = false;
        let commandObjKeys = Object.keys(commandsObj);
        commandObjKeys.forEach(key => {
            if (commandArr[0] === key && exec) {
                msg.channel.startTyping();
                commandsObj[commandArr[0]](commandArr[1], commandArr[2], commandArr[3])
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
            if (!m.author.bot && m.author.id === user.id) {
                return m.content;
            }
        });
        return output.filter(m => m !== undefined && !(m.startsWith(guildsObj[guild].prefix)));
    }

    async function fetchUptime() {
        return Moment.duration(client.uptime).humanize();
    }

    function invalidUserCheck(msgs) {
        if (msgs.length < 1) {
            let issue = new Discord.MessageEmbed()
                .setColor("#F93A2F")
                .setAuthor("Error:")
                .setDescription(`*Huston, we can't see anything.* Looks like that user hasn't sent any plain-text messages (out of the last 100).`);
            msg.reply(issue);
            return true;
        }
    }

    if (!commandIntp(commandArr, false)) {
        let issue = new Discord.MessageEmbed()
            .setColor("#F93A2F")
            .setAuthor("Error:")
            .setDescription(`*Huston, we have an invalid command.* You can always ask for \`${guildsObj[guild].prefix} help\``);
        msg.reply(issue);

    } else {
        commandIntp(commandArr, true);
    }
});

client.on("error", console.error);

client.login(process.env.TOKEN);