// Remplacez ces fonctions dans votre <script>
const GITHUB_USER = "MercuryTsury";
const GITHUB_REPO = "wolvesville";

async function init() {
    try {
        // On demande à GitHub la liste des fichiers dans le dossier data/clan
        const resp = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/data/clan`);
        const files = await resp.json();
        
        // On filtre pour n'avoir que les .json et on récupère leurs noms
        const dates = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => f.name.replace('.json', ''))
            .sort()
            .reverse();

        const select = document.getElementById('dateSelect');
        dates.forEach(d => {
            select.innerHTML += `<option value="${d}">${d}</option>`;
        });
        
        loadData();
    } catch (e) {
        console.error("Erreur d'initialisation:", e);
    }
}

async function loadData() {
    const date = document.getElementById('dateSelect').value;
    const loading = document.getElementById('loadingMsg');
    loading.innerText = "Chargement...";

    try {
        // 1. Charger le fichier du clan pour avoir la liste des membres
        const clanResp = await fetch(`./data/clan/${date}.json`);
        const clanData = await clanResp.json();
        
        // 2. Charger les fichiers de chaque membre en parallèle
        const promises = clanData.membres.map(name => 
            fetch(`./data/membres/${name}/${date}.json`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
        );

        const results = await Promise.all(promises);
        currentData = results.filter(r => r !== null); // On enlève les erreurs
        
        render();
        loading.innerText = "";
    } catch (e) {
        loading.innerText = "Erreur de chargement.";
        console.error(e);
    }
}
