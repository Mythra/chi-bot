const justEditedId = [];
const faceList = [
  '(・`ω´・)',
  ';;w;;',
  'owo',
  'UwU',
  '>w<',
  '^w^',
  ':flushed:',
];
const OWOIFY_USERS = process.env.BOTTOMS.split(',');

const owoifyText = content => {
  const words = content.split(' ');
  let output = '';

  for (let index = 0; index < words.length; index++) {
    const element = words[index];
    if (
      !element.startsWith('<@') &&
      !element.match(
        /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
      )
    ) {
      let formatString = element
        .replace(/(?:r|l)/g, 'w')
        .replace(/(?:R|L)/g, 'W')
        .replace(/(n)([aeiou])/gi, '$1y$2')
        .replace(/ove/g, 'uv')
        .replace(/th/g, 'ff');

      formatString = formatString.replace(
        /\!+/g,
        ' ' + faceList[Math.floor(Math.random() * faceList.length)].name + ' ',
      );

      output += formatString + ' ';
    } else {
      output += element + ' ';
    }
  }

  return output;
};

const MakeBottom = async msg => {
  const idx = justEditedId.indexOf(msg.id);
  if (idx != -1) {
    justEditedId.splice(idx, 1);
    return;
  }

  if (
    msg['author'] == null ||
    msg['author']['id'] == null ||
    !OWOIFY_USERS.contains(msg.author.id)
  ) {
    return;
  }
  justEditedId.push(msg.id);
  try {
    await msg.edit(owoifyText(msg.content));
  } catch (err) {
    console.log('Faiwwed to edit uwu!');
  }
};

module.exports = {
  dg: MakeBottom,
};
