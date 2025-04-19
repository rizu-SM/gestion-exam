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
// Define the updateTotal function
function updateTotal(data) {
  const totalSurveillances = data.reduce((acc, enseignant) => acc + (enseignant.nbrSS || 0), 0);
  document.getElementById("total-surveillances").textContent = totalSurveillances;
  document.getElementById("total-surveillants").textContent = data.length;
}
function updateTotalAssigned(data) {
  // Filtrer les surveillants ayant au moins une surveillance
  const totalAssigned = data.filter(enseignant => enseignant.nbrSS > 0).length;

  // Mettre à jour l'élément HTML avec l'ID "total_assigne"
  const totalAssignedElement = document.getElementById("total_assigne");
  console.log(totalAssigned);
  if (totalAssignedElement) {
    totalAssignedElement.textContent = totalAssigned; // Affiche le total des assignés
  }
}
async function initializeAndUpdate() {
  try {
    formationsData = await loadFormations();
    await updateSurveillanceCounts();
    initFilters();
    const data = await fetchData(); // Récupère les données à jour
    updateTotal(data); // Met à jour les totaux
    updateTotalAssigned(data); // Met à jour le total des surveillants assignés
  } catch (error) {
    console.error("Erreur initialisation:", error);
  }
}

async function fetchData() {
  try {
      const response = await fetch('http://localhost:3000/enseignants'); // Remplacez par l'URL correcte
      if (!response.ok) {
          throw new Error('Erreur de récupération des données');
      }
      return await response.json();  // Récupère les données au format JSON
  } catch (error) {
      console.error('Erreur fetchData:', error);
      throw error; // Lance une erreur si la récupération échoue
  }
}

async function updateSurveillanceCounts() {
  try {
      const response = await fetch('http://localhost:3000/update-surveillances');
      if (!response.ok) {
          throw new Error('Échec de la mise à jour des compteurs');
      }
      return await response.json();
  } catch (error) {
      console.error("Erreur mise à jour compteurs:", error);
      throw error;
  }
}


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

    initializeAndUpdate();

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
    async function modifierSurveillance(surveillanceId) {
      try {
        // 1. Récupérer les données actuelles
        const response = await fetch(`http://localhost:3000/surveillances/${surveillanceId}`);
        const surveillance = await response.json();
    
        if (!response.ok) throw new Error(surveillance.message || "Échec de la récupération");
    
        // Convertir la date au format YYYY-MM-DD pour le champ input[type="date"]
        const formattedDate = new Date(surveillance.date_exam).toISOString().split('T')[0];
    
        // 2. Afficher un formulaire de modification
        const formHtml = `
          <div class="modal-form">
            <h3>Modifier la surveillance</h3>
            
            <div class="form-group">
              <label>Date:</label>
              <input type="date" id="edit-date" value="${formattedDate}" required>
            </div>
            
            <div class="form-group">
              <label>Horaire:</label>
              <input type="time" id="edit-time" value="${surveillance.horaire}" required>
            </div>
            
            <div class="form-group">
              <label>Module:</label>
              <input type="text" id="edit-module" value="${surveillance.module}" required>
            </div>
            
            <div class="form-group">
              <label>Salle:</label>
              <input type="text" id="edit-salle" value="${surveillance.salle}" required>
            </div>
            
            <div class="form-group">
              <label>Spécialité:</label>
              <input type="text" id="edit-specialite" value="${surveillance.specialite}" required>
            </div>
            
            <div class="form-buttons">
              <button type="button" class="cancel-btn">Annuler</button>
              <button type="button" class="save-btn">Enregistrer</button>
            </div>
          </div>
        `;
    
        // 3. Afficher la modal
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = formHtml;
        document.body.appendChild(modal);
    
        // 4. Gestion des événements
        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
        
        modal.querySelector('.save-btn').addEventListener('click', async () => {
          try {
            const updatedData = {
              date_exam: document.getElementById('edit-date').value,
              horaire: document.getElementById('edit-time').value,
              module: document.getElementById('edit-module').value,
              salle: document.getElementById('edit-salle').value,
              specialite: document.getElementById('edit-specialite').value,
              code_enseignant: surveillance.code_enseignant // Conserver le même enseignant
            };
    
            // Validation simple
            if (Object.values(updatedData).some(v => !v)) {
              throw new Error("Tous les champs sont requis");
            }
    
            const saveResponse = await fetch(`http://localhost:3000/surveillances/${surveillanceId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData)
            });
    
            const result = await saveResponse.json();
    
            if (!saveResponse.ok) throw new Error(result.error || "Échec de la modification");
    
            alert("Surveillance modifiée avec succès");
            modal.remove();
            
            // Rafraîchir les données de la carte
            await refreshSurveillanceDisplayForCard(surveillance.code_enseignant);
    
          } catch (error) {
            alert("Erreur: " + error.message);
          }
        });
    
      } catch (error) {
        console.error("Erreur modification:", error);
        alert("Erreur: " + error.message);
      }
    }
    
    // Fonction pour supprimer une surveillance
    async function supprimerSurveillance(surveillanceId, rowElement) {
      try {
        if (!confirm('Voulez-vous vraiment supprimer cette surveillance ?\nCette action est irréversible.')) {
          return;
        }
    
        const loader = showLoader();
    
        // 1. D'abord supprimer de la base de données
        const response = await fetch(`http://localhost:3000/surveillances/${surveillanceId}`, {
          method: 'DELETE'
        });
    
        if (!response.ok) {
          throw new Error('Échec de la suppression');
        }
    
        // 2. Mettre à jour les compteurs côté serveur
        await fetch('http://localhost:3000/update-surveillances');
    
        // 3. Animation de suppression UI
        rowElement.style.transition = 'all 0.3s';
        rowElement.style.opacity = '0';
        rowElement.style.transform = 'translateX(-100px)';
    
        setTimeout(async () => {
          // 4. Supprimer la ligne après l'animation
          rowElement.remove();
          
          // 5. Mettre à jour le compteur côté client
          const totalElement = document.querySelector('.total-surveillances');
          const currentTotal = parseInt(totalElement.textContent.match(/\d+/)[0]);
          totalElement.textContent = `Total: ${currentTotal - 1} surveillance(s)`;
          
          alert('Surveillance supprimée avec succès');
          await initializeAndUpdate();
        }, 300);
    
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression: ' + error.message);
      } finally {
        hideLoader();
      }
    }
    
    // Fonctions utilitaires (à ajouter à votre code)
    function showConfirmationModal(title, message, type = 'warning') {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.innerHTML = `
          <div class="confirmation-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
              <button class="confirm-btn">Confirmer</button>
              <button class="cancel-btn">Annuler</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
    
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
          modal.remove();
          resolve(true);
        });
    
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });
      });
    }
    
    function showLoader() {
      const loader = document.createElement('div');
      loader.className = 'fullscreen-loader';
      loader.innerHTML = '<div class="loader-spinner"></div>';
      document.body.appendChild(loader);
      return loader;
    }
    
    function hideLoader() {
      const loader = document.querySelector('.fullscreen-loader');
      if (loader) loader.remove();
    }
    
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast-notification ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    
    


    async function refreshSurveillanceDisplay() {
      const data = await fetchData(); // récupère les surveillances à jour
      afficherEnseignants(data);     // met à jour l'affichage HTML
      updateTotal(data);             // met à jour le total affiché
    }
    
    async function refreshSurveillanceDisplayForCard(codeEnseignant) {
      try {
        const response = await fetch(`http://localhost:3000/surveillances-enseignant/${codeEnseignant}`);
        const surveillances = await response.json();
    
        if (!response.ok) throw new Error("Erreur lors de la récupération des surveillances");
    
        // Mettre à jour l'affichage de la carte
        afficherModalSurveillances(codeEnseignant, surveillances);
      } catch (error) {
        console.error("Erreur lors du rafraîchissement de la carte :", error);
      }
    }
  
    document.addEventListener('DOMContentLoaded', () => {
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach(card => {
        card.style.opacity = '1'; // Assurez-vous que les cartes sont visibles
      });
    });
  
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
