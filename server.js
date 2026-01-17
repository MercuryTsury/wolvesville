const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('.'));

// Récupère la liste de toutes les dates uniques présentes dans les fichiers JSON
app.get('/api/available-dates', (req, res) => {
    const dates = new Set();
    const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) scanDir(fullPath);
            else if (entry.name.endsWith('.json')) dates.add(entry.name.replace('.json', ''));
        });
    };
    scanDir('./data');
    res.json(Array.from(dates).sort().reverse());
});

app.get('/api/comparison', (req, res) => {
    const targetDate = req.query.date; // Format JJ-MM-AAAA_HH-MM
    try {
        const clanDir = './data/clan';
        let clanFile;
        
        if (targetDate && fs.existsSync(path.join(clanDir, `${targetDate}.json`))) {
            clanFile = path.join(clanDir, `${targetDate}.json`);
        } else {
            // Par défaut, le plus récent
            const files = fs.readdirSync(clanDir).filter(f => f.endsWith('.json')).sort().reverse();
            clanFile = path.join(clanDir, files[0]);
        }

        const clanData = JSON.parse(fs.readFileSync(clanFile, 'utf8'));
        const membersData = [];

        clanData.membres.forEach(name => {
            const memberDir = `./data/membres/${name}`;
            let mFile;
            if (targetDate && fs.existsSync(path.join(memberDir, `${targetDate}.json`))) {
                mFile = path.join(memberDir, `${targetDate}.json`);
            } else if (fs.existsSync(memberDir)) {
                const mFiles = fs.readdirSync(memberDir).filter(f => f.endsWith('.json')).sort().reverse();
                if (mFiles[0]) mFile = path.join(memberDir, mFiles[0]);
            }
            if (mFile) membersData.push(JSON.parse(fs.readFileSync(mFile, 'utf8')));
        });

        res.json(membersData);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Serveur prêt : http://localhost:${PORT}`));