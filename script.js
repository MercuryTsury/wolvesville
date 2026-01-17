document.getElementById('clanFile').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const clanData = JSON.parse(event.target.result);
        processClan(clanData);
    };
    reader.readAsText(e.target.files[0]);
});

async function processClan(clan) {
    const tbody = document.getElementById('memberData');
    tbody.innerHTML = "<tr><td colspan='7'>Chargement des membres...</td></tr>";

    const memberPromises = clan.membres.map(async (memberName) => {
        try {
            // Ici, on simule l'accès au dernier fichier du membre
            // Dans un environnement réel, vous devriez pointer vers le bon chemin
            // Exemple : `/data/membres/${memberName}/17-01-2026_18-00.json`
            const response = await fetch(`./data/membres/${memberName}/dernier.json`);
            if (!response.ok) throw new Error('Fichier non trouvé');
            return await response.json();
        } catch (err) {
            console.error(`Impossible de charger le membre ${memberName}`);
            return null;
        }
    });

    const membersResults = await Promise.all(memberPromises);
    displayData(membersResults.filter(m => m !== null));
}

function displayData(members) {
    const tbody = document.getElementById('memberData');
    tbody.innerHTML = "";

    members.forEach(m => {
        // Calcul du nombre de cartes Epiques
        const epicCards = m.cartes ? m.cartes.filter(c => c.rarity === "EPIC").length : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${m.nom_utilisateur}</strong></td>
            <td><span class="level-badge">${m.niveau}</span></td>
            <td>${m.statistiques.statistiques_global.total_victoires}</td>
            <td>${m.statistiques.statistiques_global.ratio_victoires}</td>
            <td>${m.statistiques.statistiques_global.total_minutes_jouer} min</td>
            <td>${m.clan.donations.gold.allTime} 💰</td>
            <td><span class="epic-count">${epicCards}</span></td>
        `;
        tbody.appendChild(row);
    });
}