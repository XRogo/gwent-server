const fs = require('fs');

const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
console.log('Lines before:', lines.length);

const startIdx = lines.findIndex(l => l.includes("save-full-deck"));
const endIdx = lines.findIndex(l => l.includes("send-to-p1"));

console.log('Start idx:', startIdx);
console.log('End idx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const cardsStartIdx = lines.findIndex(l => l.includes('// Wczytywanie kart używanych przez backend do zliczania punktów'));
    const gamesDeclIdx = lines.findIndex(l => l.includes('const games = {};'));
    const appStaticIdx = lines.findIndex(l => l.includes("app.use(express.static('public'));"));
    
    let newLines = [];
    newLines = newLines.concat(lines.slice(0, cardsStartIdx));
    newLines.push("const { registerClassicGwentEvents } = require('./server_gwent_classic');");
    newLines.push("const games = {};");
    newLines.push("");
    newLines = newLines.concat(lines.slice(appStaticIdx, startIdx));
    
    newLines.push("    // Mode-specific game logic");
    newLines.push("    registerClassicGwentEvents(socket, io, games);");
    newLines.push("");
    
    newLines = newLines.concat(lines.slice(endIdx));
    
    fs.writeFileSync('server.js', newLines.join('\n'), 'utf8');
    console.log('Lines after:', newLines.length);
    console.log('Done');
} else {
    console.log('Not found');
}
