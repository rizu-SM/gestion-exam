// Simple modal toggle functionality
const addProctorBtn = document.getElementById('addProctorBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const modal = document.getElementById('modal');

addProctorBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    
});

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelAddBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

//------------------------SAMI PARTE--------------------------------

let formationsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        formationsData = await loadFormations();
        await fetch('http://localhost:3000/update-surveillances');
        initFilters();
    } catch (error) {
        console.error("Erreur initialisation:", error);
    }
});

// Charge les données formations
async function loadFormations() {
    const response = await fetch('http://localhost:3000/envoyer-formation');
    if (!response.ok) throw new Error("Erreur chargement formations");
    return await response.json();
}

// Initialise les filtres
function initFilters() {
    const palierSelect = document.getElementById('palier');
    const specialiteSelect = document.getElementById('specialite');
    const semestreSelect = document.getElementById('semestre');
    const moduleSelect = document.getElementById('module');

    // Remplir le palier
    const paliers = [...new Set(formationsData.map(f => f.palier))];
    paliers.forEach(p => palierSelect.add(new Option(p, p)));

    // Écouteurs d'événements
    palierSelect.addEventListener('change', () => {
        specialiteSelect.disabled = !palierSelect.value;
        if (!palierSelect.value) return;
        
        // Filtrer spécialités par palier
        const specialites = [...new Set(
            formationsData
                .filter(f => f.palier === palierSelect.value)
                .map(f => f.specialite)
        )];
        
        specialiteSelect.innerHTML = '<option value="">Toutes les spécialités</option>';
        specialites.forEach(s => specialiteSelect.add(new Option(s, s)));
    });

    semestreSelect.addEventListener('change', updateModules);
    specialiteSelect.addEventListener('change', updateModules);

    function updateModules() {
        const hasAllRequired = palierSelect.value && specialiteSelect.value && semestreSelect.value;
        moduleSelect.disabled = !hasAllRequired;
        
        if (!hasAllRequired) {
            moduleSelect.innerHTML = '<option value="">Sélectionnez d\'abord les filtres</option>';
            return;
        }

        let targetSession;
        if (semestreSelect.value.startsWith('R1') || semestreSelect.value === 'S1') {
            targetSession = 'S1';
        } else if (semestreSelect.value.startsWith('R2') || semestreSelect.value === 'S2') {
            targetSession = 'S2';
        }
        // Filtrer modules en fonction des 3 critères
        const modules = [...new Set(
            formationsData
                .filter(f => 
                    f.palier === palierSelect.value &&
                    f.specialite === specialiteSelect.value &&
                    f.session === targetSession // Exact match avec S1 ou S2
                )
                .map(f => f.module)
        )];
        
        moduleSelect.innerHTML = '<option value="">Tous les modules</option>';
        modules.forEach(m => moduleSelect.add(new Option(m, m)));
    }
}

  document.getElementById("ajouter").addEventListener("click", async () => {
    const palier = document.getElementById("palier").value;
    const specialite = document.getElementById("specialite").value;
    const semestre = document.getElementById("semestre").value;
    const section = document.getElementById("section").value;
    const date_exam = document.getElementById("date").value;
    const horaire = document.getElementById("heure").value;
    const salle = document.getElementById("salle").value;
    const module = document.getElementById("module").value;
    const code_enseignant = document.getElementById("code_enseignant").value;

    try {
      const res = await fetch("http://localhost:3000/inserer-surveillance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          palier,
          specialite,
          semestre,
          section,
          date_exam,
          horaire,
          salle,
          module,
          code_enseignant
        }),
      });

      const data = await res.json();
      alert(data.message || "Surveillance ajoutée !");
    } catch (error) {
      console.error("Erreur :", error);
      alert("Erreur lors de l'envoi !");
    }
  });


  document.addEventListener('DOMContentLoaded', function() {
    let enseignantsData = [];

    fetch('http://localhost:3000/enseignants')
      .then(response => response.json())
      .then(data => {
        enseignantsData = data;
        afficherEnseignants(data);
        
        let totalSurveillances = data.reduce((acc, enseignant) => acc + (enseignant.nbrSS || 0), 0);
        document.getElementById("total-surveillances").textContent = totalSurveillances;
        document.getElementById("total-surveillants").textContent = data.length;
      })
      .catch(error => console.error('Erreur:', error));

    document.getElementById('department-filter').addEventListener('change', function() {
      const selectedDept = this.value;
      const filtered = selectedDept 
        ? enseignantsData.filter(e => e.departement && e.departement.toLowerCase() === selectedDept.toLowerCase())
        : enseignantsData;
      afficherEnseignants(filtered);
    });

    document.getElementById('grade-filter').addEventListener('change', function() {
      const selectedGrade = this.value;
      const filtered = selectedGrade 
        ? enseignantsData.filter(e => e.grade && e.grade.toLowerCase().includes(selectedGrade.toLowerCase()))
        : enseignantsData;
      afficherEnseignants(filtered);
    });
    activerRecherche();

    function afficherEnseignants(data) {
      const tableBody = document.querySelector('.table-container tbody');
      tableBody.innerHTML = '';

      data.forEach(enseignant => {
        const row = document.createElement('tr');
        const nomComplet = `${enseignant.nom} ${enseignant.prenom}`;
        const email = enseignant.email1 || 'Non disponible';
        const departement = enseignant.departement || 'Non spécifié';
        const grade = enseignant.grade || 'Non spécifié';
        const surveillances = enseignant.nbrSS || 0;

        row.innerHTML = `
          <td>
            <div class="proctor-info">
              <div class="proctor-avatar" >
                ${enseignant.nom.charAt(0).toUpperCase()}${enseignant.prenom.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="proctor-name">${nomComplet}</div>
                <div class="proctor-email">${email}</div>
              </div>
            </div>
          </td>
          <td>${departement}</td>
          <td><span class="grade-badge">${grade}</span></td>
          <td><span class="status-badge">${surveillances} Examens</span></td>
          <td>
            <button class="action-btn assign" title="Affecter" data-id="${enseignant.code_enseignant}">
              <i class="fas fa-calendar-plus"></i>
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      addEventListeners();
    }

    function getRandomColor() {
      const colors = ['#FFB6C1', '#ADD8E6', '#98FB98', '#FFD700', '#FFA07A'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function addEventListeners() {
      document.querySelectorAll('.assign').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const enseignantId = e.currentTarget.getAttribute('data-id');
          
          try {
            const response = await fetch(`http://localhost:3000/surveillances-enseignant/${enseignantId}`);
            const surveillances = await response.json();
            afficherModalSurveillances(enseignantId, surveillances);
          } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur lors de la récupération des surveillances");
          }
        });
      });

      
    }

    function afficherModalSurveillances(enseignantId, surveillances) {
      const enseignant = enseignantsData.find(e => e.code_enseignant === enseignantId);
      const nomComplet = enseignant ? `${enseignant.nom} ${enseignant.prenom}` : '';
    
      let htmlContent = `
        <div class="modal-header">
    <h5>Surveillances de ${nomComplet}</h5>
    <span class="close-modal">&times;</span>
  </div>
        <div class="modal-body">

          <table class="surveillance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Module</th>
                <th>Salle</th>
                <th>Spécialité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `;
    
      if (surveillances.length === 0) {
        htmlContent += `<p class="no-surveillance">Aucune surveillance enregistrée pour cet enseignant.</p>`;
      } else {

    
        surveillances.forEach(surv => {
          htmlContent += `
            <tr data-id="${surv.id}">
              <td>${new Date(surv.date_exam).toLocaleDateString()}</td>
              <td>${surv.horaire}</td>
              <td>${surv.module}</td>
              <td>${surv.salle}</td>
              <td>${surv.specialite}</td>
              <td class="actions-cell">
                <button class="action-btn modify-surveillance" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-surveillance" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        });
    
        htmlContent += `
            </tbody>
          </table>
          <div class="total-surveillances">
            Total: ${surveillances.length} surveillance(s)
          </div>
        `;
      }
    
      htmlContent += `</div>`;
    
      const modal = document.createElement('div');
      modal.className = 'custom-modal';
      modal.innerHTML = htmlContent;
      document.body.appendChild(modal);
    
      // Gestion des événements pour les boutons
      modal.querySelectorAll('.modify-surveillance').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const row = e.target.closest('tr');
          const surveillanceId = row.getAttribute('data-id');
          modifierSurveillance(surveillanceId);
        });
      });
    
      modal.querySelectorAll('.delete-surveillance').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const row = e.target.closest('tr');
          const surveillanceId = row.getAttribute('data-id');
          supprimerSurveillance(surveillanceId, row);
        });
      });
    
      modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
      });
    
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
    
    // Fonction pour modifier une surveillance
    function modifierSurveillance(surveillanceId) {
      console.log('Modifier surveillance:', surveillanceId);
      // Implémentez votre logique de modification ici
      // Par exemple, ouvrir un formulaire de modification
    }
    
    // Fonction pour supprimer une surveillance
    async function supprimerSurveillance(surveillanceId, rowElement) {
      if (!confirm('Voulez-vous vraiment supprimer cette surveillance ?')) {
        return;
      }
    
      try {
        const response = await fetch(`http://localhost:3000/surveillances/${surveillanceId}`, {
          method: 'DELETE'
        });
    
        if (response.ok) {
          rowElement.remove();
          // Mettre à jour le compteur total
          const totalElement = document.querySelector('.total-surveillances');
          const currentTotal = parseInt(totalElement.textContent.match(/\d+/)[0]);
          totalElement.textContent = `Total: ${currentTotal - 1} surveillance(s)`;
        } else {
          throw new Error('Échec de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert("Erreur lors de la suppression de la surveillance");
      }
    
    
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
  
}); // Fin du DOMContentLoaded


  function activerRecherche() {
    const searchInput = document.querySelector(".search-input");
  
    searchInput.addEventListener("keyup", () => {
      const filter = searchInput.value.toLowerCase();
      const rows = document.querySelectorAll(".table-container tbody tr");
  
      rows.forEach(row => {
        const name = row.querySelector(".proctor-name")?.textContent.toLowerCase();
        if (name && name.includes(filter)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }
  