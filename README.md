# Chi-Bot #

Chi-Bot is a bot primarily developed for Stryder7x's Discord Servers #code-channel.
It was originally developed to only reach out to Compiler Explorer (hence the name
Chi: "Compilers Have Invaded", (also being named after a mod "Chi" in Stryder's server)).
It has since expanded to include reaching out to Quick-Bench, as well as several other
"Fun" commands just on a whim.

Although it is only developed for Stryder's Server if you really wanted to add it you could
do so at the link:

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

* Matt Godbolt & Others who have made CompilerExplorer great.
* Fred Tingaud & Others who have made QuickBench great.
* Chi - Letting me use her name & PFP for the "official" bot.
* Javascript - for nothing.