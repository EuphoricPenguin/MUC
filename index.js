/**
 * Markov User Cloner (MUC)
 * (c) EuphoricPenguin, MIT License
 * v1.6.11
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
  client.user
    .setActivity(`for ${config.prefix} help`, { type: "WATCHING" })
    .catch(console.error);
});

client.on("message", (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) {
    msg.author.send(
      "I'm sorry, MUC doesn't support DM interaction at this time."
    );
    return;
  }
  let guild = msg.guild.id;
  if (!(guild in guildsObj)) guildsObj[guild] = {};
  if (!("prefix" in guildsObj[guild])) guildsObj[guild].prefix = config.prefix;
  if (!("order" in guildsObj[guild])) guildsObj[guild].order = config.order;
  if (!("length" in guildsObj[guild])) guildsObj[guild].length = 0;

  if (!msg.content.startsWith(guildsObj[guild].prefix)) return;
  let command = msg.content.substring(guildsObj[guild].prefix.length);
  let commandArr = command.split(" ").filter((i) => i !== "");

  //Strips mentions down to user id's
  if (commandArr.length > 1 && msg.mentions.members.first()) {
    let mLength;
    if (commandArr[1].startsWith("<@!")) {
      mLength = 3;
    } else if (commandArr[1].includes("<@")) {
      mLength = 2;
    }
    commandArr[1] = commandArr[1].substring(mLength, commandArr[1].length - 1);
  }

  const commandsObj = {
    clone: async function (id) {
      if (!msg.guild.member(id)) {
        let issue = new Discord.MessageEmbed()
          .setColor("#F93A2F")
          .setAuthor("Error:")
          .setDescription(
            `*Huston, we have an ID problem.* Looks like that user doesn't exist (you probably made a typo). You can always ask for \`${guildsObj[guild].prefix} help\``
          );
        msg.reply(issue);
        return;
      }
      let targetUser = await client.users.fetch(id);
      fetchMessages(config.maxLoops, config.maxMessages, targetUser).then(
        (msgs) => {
          if (invalidUserCheck(msgs)) return;
          guildsObj[guild].chain = new Markov();
          guildsObj[guild].user = targetUser;
          guildsObj[guild].msgCnt = msgs.length;
          console.log(
            `cloning ${guildsObj[guild].user.tag} in ${
              client.guilds.cache.get(guild).name
            }`
          );
          guildsObj[guild].chain.addStates(msgs);
          let maxLen = 0;
          msgs.forEach((m) => {
            if (m.length > maxLen) maxLen = m.length;
          });
          guildsObj[guild].length = maxLen;
          guildsObj[guild].chain.train(guildsObj[guild].order);
          let clone = new Discord.MessageEmbed()
            .setColor("#FFFFFF")
            .setAuthor(
              `${guildsObj[guild].user.tag} might say:`,
              guildsObj[guild].user.displayAvatarURL()
            )
            .setDescription(
              `\`\`\`${guildsObj[guild].chain.generateRandom(
                guildsObj[guild].length
              )}\`\`\``
            )
            .setFooter(
              `M: ${guildsObj[guild].msgCnt} O: ${guildsObj[guild].order} L: ${guildsObj[guild].length}`
            );
          msg.channel.send(clone);
        }
      );
    },
    cloneall: async function () {
      fetchMessages(config.maxLoops, config.max).then((msgs) => {
        if (invalidUserCheck(msgs)) return;
        let chain = new Markov();
        let msgCnt = msgs.length;
        console.log(
          `cloning everyone in ${client.guilds.cache.get(guild).name}`
        );
        chain.addStates(msgs);
        let maxLen = 0;
        msgs.forEach((m) => {
          if (m.length > maxLen) maxLen = m.length;
        });
        let length = maxLen;
        chain.train(guildsObj[guild].order);
        let clone = new Discord.MessageEmbed()
          .setColor("#FFFFFF")
          .setAuthor(`Everyone might say:`)
          .setDescription(`\`\`\`${chain.generateRandom(length)}\`\`\``)
          .setFooter(`M: ${msgCnt} O: ${guildsObj[guild].order} L: ${length}`);
        msg.channel.send(clone);
      });
    },
    regen: async function () {
      if (guildsObj[guild].user !== undefined) {
        console.log(
          `regenerating ${guildsObj[guild].user.tag} in ${
            client.guilds.cache.get(guild).name
          }`
        );
        let regen = new Discord.MessageEmbed()
          .setColor("#FFFFFF")
          .setAuthor(
            `${guildsObj[guild].user.tag} also might say:`,
            guildsObj[guild].user.displayAvatarURL()
          )
          .setDescription(
            `\`\`\`${guildsObj[guild].chain.generateRandom(
              guildsObj[guild].length
            )}\`\`\``
          )
          .setFooter(
            `M: ${guildsObj[guild].msgCnt} O: ${guildsObj[guild].order} L: ${guildsObj[guild].length}`
          );
        msg.channel.send(regen);
      } else {
        let issue = new Discord.MessageEmbed()
          .setColor("#F93A2F")
          .setAuthor("Error:")
          .setDescription(
            `use \`${guildsObj[guild].prefix} regen\` only after using \`${guildsObj[guild].prefix} clone\`.`
          );
        msg.reply(issue);
      }
    },
    prefix: async function (newPrefix) {
      if (
        newPrefix != undefined &&
        !(guildsObj[guild].prefix === newPrefix) &&
        msg.member.hasPermission(config.prefixPerm) &&
        newPrefix.length <= 10
      ) {
        guildsObj[guild].prefix = newPrefix;
        let prefixChange = new Discord.MessageEmbed()
          .setColor("#0099E1")
          .setDescription(`Prefix changed to \`${guildsObj[guild].prefix}\``);
        return msg.channel.send(prefixChange);
      } else {
        let issue = new Discord.MessageEmbed()
          .setColor("#F93A2F")
          .setAuthor("Error:")
          .setDescription(
            `Either you don't have the \`${config.prefixPerm}\` *(or admin/owner)* permission, the prefix is too long, the prefix is blank, or the prefix is the same.`
          );
        return msg.reply(issue);
      }
    },
    help: async function () {
      let help = new Discord.MessageEmbed()
        .setColor("#0099E1")
        .addFields(
          {
            name: "Commands:",
            value: `Use \`${guildsObj[guild].prefix} clone @user\` to clone someone.
If you want to re-generate a new message, use \`${guildsObj[guild].prefix} regen\`.
You can also use \`${guildsObj[guild].prefix} cloneall\` to clone everyone in a specified channel (regen not currently supported).
You can change this guild's prefix with \`${guildsObj[guild].prefix} prefix <string>\` (if you have the \`${config.prefixPerm}\` perm).`,
          },
          {
            name: "Other:",
            value: `The new clone/regen footer allows for a quick glance at generation metrics:
\`M:\` - Shows the number of messages that were used to generate the chain.
\`O:\` - The markov chain [order](https://qr.ae/pNK5KG) used.
\`L:\` - The maximum length for generated messages.`,
          },
          {
            name: "Tidbits:",
            value: `Uptime: **${await fetchUptime()}**
Guild ratio: **${client.guilds.cache.size} (current)**/${
              Object.keys(guildsObj).length
            } (historical) *(${(
              client.guilds.cache.size / Object.keys(guildsObj).length
            ).toFixed(2)})*`,
          },
          {
            name: "Links:",
            value: `[Bot Invite](https://discord.com/api/oauth2/authorize?client_id=689992764020097082&permissions=117824&scope=bot)
[Github Repo](https://github.com/EuphoricPenguin/MUC)
[Discord Server](https://discord.gg/MsREEap)`,
          }
        )
        .setFooter(
          config.helpFooter,
          "https://raw.githubusercontent.com/EuphoricPenguin/MUC/master/media/ep-icon.png"
        );
      msg.channel.send(help);
    },
  };

  function commandIntp(commandArr, exec) {
    let foundKey = false;
    let commandObjKeys = Object.keys(commandsObj);
    commandObjKeys.forEach((key) => {
      if (commandArr[0] === key && exec) {
        msg.channel.startTyping();
        commandsObj[commandArr[0]](commandArr[1]).then(() => {
          msg.channel.stopTyping();
        });
      } else if (commandArr[0] === key) {
        foundKey = true;
      }
    });
    return foundKey;
  }

  async function fetchMessages(maxLoops, maxMessages, user) {
    let masterOutput = [];
    let options = { limit: 100 };
    let lastId;
    let flag = true;
    for (let i = 0; flag; i++) {
      if (lastId) options.before = lastId;
      let output = await msg.channel.messages.fetch(options);
      lastId = output.last().id;
      if (
        output.size !== 100 ||
        masterOutput.length >= maxMessages - 100 ||
        i >= maxLoops
      )
        flag = false;
      output = output.map((m) => {
        //!user checks for blank object as parameter
        if (!m.author.bot && (!user || m.author.id === user.id)) {
          return m.content;
        }
      });
      masterOutput = masterOutput.concat(
        output.filter(
          (m) => m !== undefined && !m.startsWith(guildsObj[guild].prefix)
        )
      );
    }
    return masterOutput;
  }

  async function fetchUptime() {
    return Moment.duration(client.uptime).humanize();
  }

  function invalidUserCheck(msgs) {
    if (msgs.length < 1) {
      let issue = new Discord.MessageEmbed()
        .setColor("#F93A2F")
        .setAuthor("Error:")
        .setDescription(
          `*Huston, we can't see anything.* Looks like that user hasn't sent any plain-text messages.`
        );
      msg.reply(issue);
      return true;
    }
  }

  if (!commandIntp(commandArr, false)) {
    let issue = new Discord.MessageEmbed()
      .setColor("#F93A2F")
      .setAuthor("Error:")
      .setDescription(
        `*Huston, we have an invalid command.* You can always ask for \`${guildsObj[guild].prefix} help\``
      );
    msg.reply(issue);
  } else {
    commandIntp(commandArr, true);
  }
});

client.on("error", console.error);

client.login(process.env.TOKEN);
