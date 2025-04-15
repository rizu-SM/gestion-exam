document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Ici vous pourriez charger les données de la session sélectionnée
    });
});

// Modal de modification
function openEditModal() {
    document.getElementById('editModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Vérification
document.getElementById('verifyBtn').addEventListener('click', function() {
    alert("Vérification en cours...\n\nCette fonction vérifiera les conflits d'emploi du temps.");
});

// Soumission
document.getElementById('submitBtn').addEventListener('click', function() {
    alert("Soumission réussie!\n\nL'emploi du temps a été confirmé.");
});

// Fermer le modal en cliquant à l'extérieur
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

// Suppression d'un examen
document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', function() {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet examen ?")) {
            const row = this.closest('tr');
            row.remove();
            alert("Examen supprimé avec succès");
        }
    });
});

console.log("prblm");

//-------------------------------------------------------------------------
//------------------SAMI PARTE------------------------------------------------

console.log("before fetch");
document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Vous pouvez charger les données de session ici si nécessaire
    });
});

// Variables globales
let formationsData = [];
let currentExams = [];

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation...");
    loadFormations();
    
    // Configurer les écouteurs d'événements pour les dropdowns
    document.getElementById('palier').addEventListener('change', function() {
        const selectedPalier = this.value;
        console.log("Palier sélectionné: ", selectedPalier);
        const specialiteSelect = document.getElementById('specialite');
        
        specialiteSelect.innerHTML = '<option value="">Sélectionner</option>';
        specialiteSelect.disabled = true;
    
        if (selectedPalier) {
            const specialites = new Set(
                formationsData
                    .filter(formation => formation.palier === selectedPalier)
                    .map(formation => formation.specialite)
            );
    
            specialites.forEach(specialite => {
                const option = new Option(specialite, specialite);
                specialiteSelect.add(option);
            });
    
            specialiteSelect.disabled = false;
        }
    });
    
    document.getElementById('specialite').addEventListener('change', function() {
        const selectedPalier = document.getElementById('palier').value;
        const selectedSpecialite = this.value;
        console.log("Specialité sélectionnée: ", selectedSpecialite);
        const moduleSelect = document.getElementById('module');
        
        moduleSelect.innerHTML = '<option value="">Sélectionner</option>';
        moduleSelect.disabled = true;
    
        if (selectedPalier && selectedSpecialite) {
            const modules = new Set(
                formationsData
                    .filter(formation => 
                        formation.palier === selectedPalier &&
                        formation.specialite === selectedSpecialite
                    )
                    .map(formation => formation.module)
            );
    
            modules.forEach(module => {
                const option = new Option(module, module);
                moduleSelect.add(option);
            });
    
            moduleSelect.disabled = modules.size === 0;
        }
    });
    
    // Événement pour le bouton ajouter - CORRECTEMENT PLACÉ
    document.getElementById("ajouter").addEventListener("click", async function() {
        // Récupérer la session active (S1, S2, etc.)
        const activeSessionBtn = document.querySelector('.session-btn.active');
        if (!activeSessionBtn) {
            alert('Veuillez sélectionner une session');
            return;
        }
        const semestre = activeSessionBtn.dataset.semestre; 
        
        const palier = document.getElementById("palier").value;
        const specialite = document.getElementById("specialite").value;
        const module = document.getElementById("module").value;
        const section = document.getElementById("section").value;
        const date = document.getElementById("date").value;
        const heure = document.getElementById("heure").value;
        const salle = document.getElementById("salle").value;
    
        if (!palier || !specialite || !module || !date || !heure || !salle || !section) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        console.log({
            palier,
            specialite,
            section,
            module,
            date,
            heure,
            salle,
            semestre
        });
        
    
        try {
            const response = await fetch('http://localhost:3000/ajouter-examen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    palier,
                    specialite,
                    section,
                    module,
                    date,
                    heure,
                    salle,
                    semestre
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Examen ajouté avec succès!');
                resetForm();
            } else {
                alert(data.message || "Erreur lors de l'ajout");
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur lors de l'envoi des données");
        }
    });
});

// Charger les formations depuis le backend
async function loadFormations() {
    console.log('Tentative de récupération des formations...');
    try {
        const response = await fetch('http://localhost:3000/envoyer-formation');
        console.log('Réponse reçue:', response);
        formationsData = await response.json();
        setupPalierDropdown();
    } catch (error) {
        console.error('Erreur dans loadFormations:', error);
        alert('Erreur lors du chargement des formations');
    }
}

// Configurer les dropdowns de palier
function setupPalierDropdown() {
    const palierSelect = document.getElementById('palier');
    const paliers = new Set(formationsData.map(formation => formation.palier));
    palierSelect.innerHTML = '<option value="">Sélectionner</option>';
    paliers.forEach(palier => {
        const option = new Option(palier, palier);
        palierSelect.add(option);
    });
}

function resetForm() {
    document.getElementById("section").value = "";
    document.getElementById("date").value = "";
    document.getElementById("heure").value = "";
    document.getElementById("salle").value = "";
    // Réinitialiser les selects si nécessaire
}