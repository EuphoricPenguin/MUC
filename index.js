/**
 * Markov User Cloner (MUC or M.U.C)
 * (C) EuphoricPenguin, MIT License
 * v1.0.0
 */
const config = require("./config.json")
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
    if (msg.author.bot && !msg.content.indexOf(config.prefix) === 0) return;

    let command = msg.content.substring(1);
    let commandArr = command.split(" ");
    let guild = msg.guild.id;
    const commandsObj = {
        "clone": function (id) {
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
        "regen": function () {
            if (guild in guildsObj) {
                console.log(`regenerating in ${guild}`);
                msg.channel.send(`They also might say:
                    \`\`\`${guildsObj[guild].generate()}\`\`\``);
            } else {
                msg.reply(`use \`${config.prefix}regen\` only after using \`${config.prefix}clone.\``);
            }
        },
        "help": function () {
            msg.author.send(config.helpIntro +
                `
Use \`${config.prefix}clone <id>\` to clone anyone, or use \`all\` instead to clone everyone.
If you want to re-generate a new message, use \`${config.prefix}regen\`.
*The bot only uses the last 100 messages or so sent in the server, so keep this in mind.*

**Currently, this bot is in ${client.guilds.size}`);
        }
    }

    function commandIntp(commandArr, exec) {
        let foundKey = false;
        let commandObjKeys = Object.keys(commandsObj);
        commandObjKeys.forEach(key => {
            if (commandArr[0] === key && exec) {
                commandsObj[commandArr[0]](commandArr[1]);
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

    if (!commandIntp(commandArr, false)) {
        msg.reply("Invalid command. You can always ask for `" + config.prefix + "help`.");
    } else {
        commandIntp(commandArr, true);
    }
});

client.on("error", console.error);

client.login(config.token);