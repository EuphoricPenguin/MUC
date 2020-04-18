<img src="./media/MUC_t.png" width="100">

If you are looking to use this bot in your own server, a publically available version can be found [here](https://discordapp.com/api/oauth2/authorize?client_id=689992764020097082&permissions=68608&scope=bot). The bot is nearly finished, and will be released shortly; for now it's offline.


MUC (Markov User Cloner) is a new Discord bot project of mine; it will be regularly updated, and is intended to be a public bot. While many bots exist to do this very thing, I wish to create a simple open source example that people can both interact with and modify. This serves mainly as a refresher for me to try some new things in JavaScript, and as my first foray into public bot development.               

With v1.1.x, three commands are present:

`!clone <id>` will clone a user based on their id, or the keyword `all`.
The bot uses the last 100 sent messages to generate a markov chain, filtering based on id.

`!regen` will use the last created markov chain for your server, and generate another reply.

`!help` will send a DM explaining this information in a concise manner.

If you wish to run it youself, you must first install Node.JS. Download and unzip the repo, and edit the *.env* file with your bot's token. Then run `npm install` and finally `node index.js`. You should see a message confrming the bot has logged in.
