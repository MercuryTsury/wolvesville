const axios = require('axios');
const fs1 = require('fs');
const fs2 = require('fs').promises;

// Configuration
const API_BASE_URL = 'https://api.wolvesville.com';
const API_KEY = '0mxkkVFKBQKpLyNJpXrgPrYfiOyVhw4pO4JZXsaegAt2bYsKgCA5oG3SdQPPD2gR';
const CLAN_ID = 'c914a82b-68ac-4105-ba8a-8a5517c75856';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Authorization': `Bot ${API_KEY}` }
});

function obtenirDateFormatee() {
    const d = new Date();

    const jour = String(d.getDate()).padStart(2, '0');
    const mois = String(d.getMonth() + 1).padStart(2, '0'); // +1 car janvier = 0
    const annee = d.getFullYear();
    
    const heures = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${jour}-${mois}-${annee}_${heures}-${minutes}`;
}

const path = require('path');

async function creerArborescence(chemin) {
    try {
        // Crée tous les dossiers parents et enfants manquants
        await fs2.mkdir(chemin, { recursive: true });
    } catch (err) {
        console.error(`❌ Erreur lors de la création : ${err.message}`);
    }
}

async function saveDailyData() {
    console.time("Temps d'exécution");
    try {
        const clanInfo = (await apiClient.get(`/clans/${CLAN_ID}/info`)).data;
        const membersDetailed = (await apiClient.get(`/clans/${CLAN_ID}/members/detailed`)).data;
        const members = (await apiClient.get(`/clans/${CLAN_ID}/members`)).data;

        const membersData = [];
        for (const detail of membersDetailed) {
            console.log(`Récupération : ${detail.username}`);
            const player = (await apiClient.get(`/players/${detail.playerId}`)).data;
            const stats = player.gameStats;
            const cartes = player.roleCards;
            

            // Calculs
            const total = stats.totalWinCount + stats.totalLoseCount + stats.totalTieCount + stats.exitGameBySuicideCount;
            const total_village = stats.villageWinCount + stats.villageLoseCount;
            const total_loups = stats.werewolfWinCount + stats.werewolfLoseCount;
            const total_vote = stats.votingWinCount + stats.votingLoseCount;
            const total_solo = stats.soloWinCount + stats.soloLoseCount;
            const total_etat = stats.gamesSurvivedCount + stats.gamesKilledCount;
            const safe = (n, d) => (d === 0 ? 0 : (n / d).toFixed(10));

            membersData.push({
                identifiant: detail.playerId,
                nom_utilisateur: detail.username,
                description: player.personalMessage,
                niveau: player.level,
                status: player.status,
                date_creation: player.creationTime,
                derniere_connexion: player.lastOnline,
                roses: {
                    recus: player.receivedRosesCount,
                    envoyees: player.sentRosesCount,
                    ratio: player.sentRosesCount > 0 ? (player.receivedRosesCount / player.sentRosesCount).toFixed(2) : player.receivedRosesCount.toFixed(2),
                },
                icone_profil: {
                    identifiant: player.profileIconId,
                    couleur: player.profileIconColor,
                    mode_couleur: player.fileIconColorMode,
                },
                avatar_actuel: {
                    url: player.url,
                    largeur: player.width,
                    hauteur: player.height,
                },
                avatars: player.avatars,
                badges: player.badgeIds,
                cartes: player.roleCards,
                statistiques: {
                    statistiques_global: {
                        total_victoires: stats.totalWinCount,
                        total_defaites: stats.totalLoseCount,
                        total_nuls: stats.totalTieCount,
                        total_suicides: stats.exitGameBySuicideCount,
                        ratio_victoires: safe(stats.totalWinCount, total),
                        ratio_defaites: safe(stats.totalLoseCount, total),
                        ratio_nuls: safe(stats.totalTieCount, total),
                        ratio_suicides: safe(stats.exitGameBySuicideCount, total),
                        total_parties_quitter_apres_mort: stats.exitGameAfterDeathCount,
                        total_parties_survecu: stats.gamesSurvivedCount,
                        total_parties_morts: stats.gamesKilledCount,
                        ratio_vivants: safe(stats.gamesSurvivedCount, total_etat),
                        ratio_morts: safe(stats.gamesKilledCount, total_etat),
                        total_minutes_jouer: stats.totalPlayTimeInMinutes,
                    },
                    statistiques_village: {
                        total_victoires: stats.villageWinCount,
                        total_defaites: stats.villageLoseCount,
                        ratio_victoires: safe(stats.villageWinCount, total_village),
                        ratio_defaites: safe(stats.villageLoseCount, total_village),
                    },
                    statistiques_loups: {
                        total_victoires: stats.werewolfWinCount,
                        total_defaites: stats.werewolfLoseCount,
                        ratio_victoires: safe(stats.werewolfWinCount, total_loups),
                        ratio_defaites: safe(stats.werewolfLoseCount, total_loups),
                    },
                    statistiques_vote: {
                        total_victoires: stats.votingWinCount,
                        total_defaites: stats.votingLoseCount,
                        ratio_victoires: safe(stats.votingWinCount, total_vote),
                        ratio_defaites: safe(stats.votingLoseCount, total_vote),
                    },
                    statistiques_solo: {
                        total_victoires: stats.soloWinCount,
                        total_defaites: stats.soloLoseCount,
                        ratio_victoires: safe(stats.soloWinCount, total_solo),
                        ratio_defaites: safe(stats.soloLoseCount, total_solo),
                    },
                    trophees: stats.achievements,
                },
                clan: {
                    donations: detail.donated,
                    xp_clan: detail.xpDuration,
                    xp_clan_total: detail.xp,
                    staff: detail.isCoLeader,
                    quetes: {
                        participation_quetes: detail.participateInClanQuests,
                        nombre_or: detail.goldQuests,
                        nombre_gemmes: detail.gemQuests
                    }
                }
            });
            await new Promise(r => setTimeout(r, 150));
        }

        // --- NOMMAGE DU FICHIER PAR DATE ---
        const dateStr = obtenirDateFormatee();
        const clanFileName = `data/clan/${dateStr}.json`;

        const finalOutput = {
            date: dateStr,
            clanName: clanInfo.name,
            members: membersData
        };

        for (const membre of membersData) {
            await creerArborescence(`data/membres/${membre.nom_utilisateur}`);
            const fileName = `data/membres/${membre.nom_utilisateur}/${dateStr}.json`;
            fs1.writeFileSync(fileName, JSON.stringify(membre, null, 2));
            console.log(`Données de ${membre.nom_utilisateur} enregistrer`)
        };
        
        clanInfo.membres = membersData.map(m => m.nom_utilisateur)

        await creerArborescence(`data/clan`)
        fs1.writeFileSync(clanFileName, JSON.stringify(clanInfo, null, 2));
        console.log(`Données sauvegardées dans : data`);

    } catch (error) {
        console.error("Erreur:", error.message);
    }
    console.timeEnd("Temps d'exécution");
}

saveDailyData();

