# Chi-Bot #

Chi-Bot is a bot that allows you to reach out to Compiler-Explorer directly
from discord. No longer do you have to leave the safety of your discord
channel. Even if you want to make a particular compiler cry.

It is called "Chi-Bot" because not only is "Chi" the name of a friend of
the creator, but it also can be acronymed to: "Compiler Have Invaded" which
just sounds edgy, and discord is like the place for anything edgy (and
sometimes serious) discussion.

Feel free to deploy chi-bot to your own discord server, however if you want
to use the one hosted by the creator you'd want to go to:

<https://discordapp.com/oauth2/authorize?client_id=684897448090665002&scope=bot&permissions=67169344>

However, currently this can only be done by the creator to prevent abuse.
If you want to talk about getting this bot added please feel free to reach out to me.

## Developing Locally ##

To develop locally you should have nodejs > v12 installed. I recommend the latest
LTS (v13 at the time of writing). Once you have it installed, you can run: `npm install`
to install all the dependencies (NOTE: some are native so you should have a working
C compiler).

Once you've done that simply run: `npm run start` to start the bot. Assuming you have:
`CHI_BOT_DISCORD_TOKEN` set in the environment.

To format the codebase run: `npm run format`.
To lint the codebase run: `npm run lint`.

## Deploying ##

Simply run `npm install --production`, and then run: `npm start` with the bot token
inside of `CHI_BOT_DISCORD_TOKEN`.

## Special Thanks ##

* Matt Godbolt & Others who have made CompilerExplorer great - This wouldn't be possible without you.
* Chi - Letting me use her name & PFP for the "official" bot.
* Javascript - for nothing.