document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Ici vous pourriez charger les données de la session sélectionnée
    });
});





// Simple modal toggle functionality
const addProctorBtn = document.getElementById('addProctorBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const closeBtn = document.getElementById('closeModalBtn');
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

closeBtn.addEventListener('click', () => {
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

    document.getElementById('department-filter').addEventListener('change', applyFilters);
    document.getElementById('grade-filter').addEventListener('change', applyFilters);

    function applyFilters() {
        const selectedDept = document.getElementById('department-filter').value.toLowerCase();
        const selectedGrade = document.getElementById('grade-filter').value.toLowerCase();

        const filtered = enseignantsData.filter(enseignant => {
            const matchesDept = !selectedDept || (enseignant.departement && enseignant.departement.toLowerCase() === selectedDept);
            const matchesGrade = !selectedGrade || (enseignant.grade && enseignant.grade.toLowerCase().includes(selectedGrade));
            return matchesDept && matchesGrade; // Both filters must match
        });

        afficherEnseignants(filtered);
    }

    activerRecherche();

    function afficherEnseignants(data) {
      const tableBody = document.querySelector('.table-container tbody');
      tableBody.innerHTML = '';

      if (data.length === 0) {
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">
                    Pas de Enseignant Disponible.
                </td>
            </tr>
        `;
      }

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
              <i class="fas fa-eye"></i>
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
      const nomComplet = enseignant? `${enseignant.nom.charAt(0).toUpperCase()}${enseignant.nom.slice(1).toLowerCase()} ${enseignant.prenom.charAt(0).toUpperCase()}${enseignant.prenom.slice(1).toLowerCase()}`: '';
      const grade = enseignant?.grade || 'Non spécifié';
      const departement = enseignant?.departement || 'Non spécifié';

      let htmlContent = `
      <div class="modal-overlay">
          <div class="exam-modal">
              <div class="modal-header">
                  <h2 class="modal-title">Surveillances de ${nomComplet}</h2>
                  <span class="close-modal">&times;</span>
              </div>
              
              <div class="modal-body">
                  <div class="exam-section">
                      <h3 class="section-title">
                          <i class="fas fa-info-circle"></i> Informations de Base
                      </h3>
                      <div class="details-grid">
                          <div class="detail-item">
                              <div class="detail-label">Nom complet</div>
                              <div class="detail-value">${nomComplet}</div>
                          </div>
                          <div class="detail-item">
                              <div class="detail-label">Grade</div>
                              <div class="detail-value">${grade}</div>
                          </div>
                          <div class="detail-item">
                              <div class="detail-label">Département</div>
                              <div class="detail-value">${departement}</div>
                          </div>
                          <div class="detail-item">
                              <div class="detail-label">Total surveillances</div>
                              <div class="detail-value">${surveillances.length}</div>
                          </div>
                      </div>
                  </div>
                  
                  <div class="exam-section">
                      <h3 class="section-title">
                          <i class="fas fa-calendar-check"></i> Surveillances Assignées
                      </h3>`;
        
  
      if (surveillances.length === 0) {
          htmlContent += `
                      <div class="no-data-message">
                          <i class="fas fa-info-circle"></i> Aucune surveillance enregistrée pour cet enseignant
                      </div>`;
      } else {
          htmlContent += `
                      <div class="table-container">
                          <table class="styled-table">
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
                              <tbody>`;
  
          surveillances.forEach(surv => {
              // Format the date as DD/MM/YYYY
              const formattedDate = formatDate(surv.date_exam);
              // Format time (08:00:00 → 08:00)
              const formattedTime = formatTime(surv.horaire);
              htmlContent += `
                                  <tr data-id="${surv.id}">
                                      <td>${formattedDate}</td>
                                      <td>${formattedTime}</td>
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
                                  </tr>`;
          });
  
          htmlContent += `
                              </tbody>
                          </table>
                      </div>`;
      }
  
      htmlContent += `
                  </div>
              </div>
              
              <div class="modal-footer">
                  <button class="modal-btn btn-primary" id="sendBtn">
                  <i class="fa fa-envelope"></i> Envoyer
                  </button>
                  <button class="modal-btn btn-primary" id="printBtn">
                      <i class="fas fa-print"></i> Imprimer
                  </button>
              </div>
          </div>
      </div>`;
  
      const modal = document.createElement('div');
      modal.innerHTML = htmlContent;
      document.body.appendChild(modal);
  
      // Add this style element for the table enhancements
      const style = document.createElement('style');
      style.textContent = `
          .table-container {
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              // border: 1px solid #e0e0e0;
          }
          
          .styled-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              background: white;
          }
          
          .styled-table th {
              background-color: var(--primary);
              color: white;
              padding: 12px 15px;
              text-align: left;
              border: none;
          }
          
          .styled-table th:first-child {
              border-top-left-radius: 11px;
          }
          
          .styled-table th:last-child {
              border-top-right-radius: 11px;
          }
          
          .styled-table td {
              padding: 12px 15px;
              border-bottom: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
          }
          
          .styled-table td:first-child {
              border-left: 1px solid #e0e0e0;
          }
          
          .styled-table tr:last-child td {
              border-bottom: none;
          }
          
          .styled-table tr:hover td {
              background-color: #f8f9fa;
          }

          .close-modal {
            background: none;
            border: none;
            font-size: 1.75rem;
            cursor: pointer;
            color: #7f8c8d;
            transition: color 0.2s ease;
            padding: 0 0.5rem;
          } 

          .close-modal:hover {
            color: #e74c3c;
          }
      `;
      modal.appendChild(style);
  
      // Rest of your event handlers remain the same...
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
  
      // modal.querySelector('#sendBtn').addEventListener('click', async function() {
        
      // });

    //   modal.querySelector('#sendBtn').addEventListener('click', async function() {
    //     const sendBtn = modal.querySelector('#sendBtn');
    //     const originalContent = sendBtn.innerHTML;
        
    //     try {
    //         // Afficher la boîte de confirmation
    //         const confirmation = await Swal.fire({
    //             title: 'Confirmation',
    //             text: `Êtes-vous sûr de vouloir envoyer le rapport de surveillance à ${nomComplet} ?`,
    //             icon: 'question',
    //             showCancelButton: true,
    //             confirmButtonColor: '#3085d6',
    //             cancelButtonColor: '#d33',
    //             confirmButtonText: 'Oui, envoyer',
    //             cancelButtonText: 'Annuler'
    //         });
    
    //         // Si l'utilisateur annule, on ne fait rien
    //         if (!confirmation.isConfirmed) {
    //             return;
    //         }
    
    //         // Afficher un indicateur de chargement
    //         sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    //         sendBtn.disabled = true;
    
    //         // Envoyer la requête au serveur pour cet enseignant spécifique
    //         const response = await fetch('http://localhost:3000/envoyer-mail-enseignant', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 enseignantId: enseignantId,
    //                 surveillances: surveillances
    //             })
    //         });
    
    //         const result = await response.json();
    
    //         if (result.success) {
    //             await Swal.fire({
    //                 icon: 'success',
    //                 title: 'Succès',
    //                 text: `L'email a été envoyé avec succès à ${nomComplet} !`,
    //                 confirmButtonText: 'OK'
    //             });
    //         } else {
    //             await Swal.fire({
    //                 icon: 'error',
    //                 title: 'Erreur',
    //                 text: result.message || `Erreur lors de l'envoi de l'email à ${nomComplet}`,
    //                 confirmButtonText: 'OK'
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Erreur:', error);
    //         await Swal.fire({
    //             icon: 'error',
    //             title: 'Erreur',
    //             text: `Une erreur s'est produite lors de l'envoi de l'email à ${nomComplet}`,
    //             confirmButtonText: 'OK'
    //         });
    //     } finally {
    //         // Réinitialiser le bouton
    //         sendBtn.innerHTML = originalContent;
    //         sendBtn.disabled = false;
    //     }
    // });

    // Récupérer le bouton après l'avoir ajouté au DOM
    const sendBtn = modal.querySelector('#sendBtn');

    sendBtn.addEventListener('click', async () => {
      try {
        // Afficher la boîte de confirmation
        const confirmation = await Swal.fire({
          title: 'Confirmation',
          text: 'Êtes-vous sûr de vouloir envoyer le emplois de surveillance ?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#4361ee',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Oui, envoyer',
          cancelButtonText: 'Annuler'
        });
        // Si l'utilisateur annule, on ne fait rien
        if (!confirmation.isConfirmed) {
          return;
        }

        // Afficher un indicateur de chargement
        sendBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Envoi en cours...';
        sendBtn.disabled = true;

        // Envoyer la requête au serveur
        const response = await fetch('http://localhost:3000/envoyer-mail-enseignant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code_enseignant: enseignantId // Assurez-vous d'avoir cette variable disponible
            })
        });

        const result = await response.json();

          if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: `l'emplois de surveillance a été envoyé avec succès à Pr. ${nomComplet} !`,
                confirmButtonText: 'OK'
            });
          } else {
            await Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: result.message || `Erreur lors de l'envoi de l'emplois de surveillance à Pr. ${nomComplet}`,
              confirmButtonText: 'OK'
            });
          }
      } catch (error) {
          console.error('Erreur:', error);
          await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: `Une erreur s'est produite lors de l'envoi de l'emplois de surveillance à Pr. ${nomComplet}`,
                confirmButtonText: 'OK'
          });
      } finally {
          // Réinitialiser le bouton
          sendBtn.innerHTML = '<i class="fa fa-envelope"></i> Envoyer';
          sendBtn.disabled = false;
      }
      });

      modal.querySelector('#printBtn').addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const printDate = new Date().toLocaleDateString('fr-FR');
        const printTime = new Date().toLocaleTimeString('fr-FR');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Surveillances de ${nomComplet}</title>
                    <style>
                        @page { size: A4; margin: 1cm; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            padding: 20px;
                        }
                        .print-header { 
                            text-align: center;
                            margin-bottom: 20px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #4361ee;
                        }
                        .print-title {
                            color: #2c3e50;
                            margin-bottom: 5px;
                        }
                        .print-subtitle {
                            color: #7f8c8d;
                            font-weight: normal;
                            margin-top: 0;
                        }
                        .print-section { 
                            margin-bottom: 25px;
                            page-break-inside: avoid;
                        }
                        .section-title {
                            color: #4361ee;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                            margin-bottom: 15px;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 15px;
                            margin-bottom: 20px;
                        }
                        .info-item {
                            margin-bottom: 10px;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #7f8c8d;
                            font-size: 0.9em;
                        }
                        .print-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                            font-size: 0.9em;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
                        }
                        .print-table th {
                            background-color: #4361ee;
                            color: white;
                            text-align: left;
                            padding: 10px 12px;
                        }
                        .print-table td {
                            padding: 8px 12px;
                            border-bottom: 1px solid #ddd;
                        }
                        .print-table tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .print-footer {
                            margin-top: 30px;
                            font-size: 0.8em;
                            color: #7f8c8d;
                            text-align: right;
                            border-top: 1px solid #eee;
                            padding-top: 10px;
                        }
                        @media print {
                            .no-print { display: none; }
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1 class="print-title">Surveillances de ${nomComplet}</h1>
                        <p class="print-subtitle">${printDate} à ${printTime}</p>
                    </div>
                    
                    <div class="print-section">
                        <h2 class="section-title">Informations de Base</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Nom complet</div>
                                <div>${nomComplet}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Grade</div>
                                <div>${grade}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Département</div>
                                <div>${departement}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total surveillances</div>
                                <div>${surveillances.length}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="print-section">
                        <h2 class="section-title">Surveillances Assignées</h2>
                        ${surveillances.length > 0 ? `
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Horaire</th>
                                    <th>Module</th>
                                    <th>Salle</th>
                                    <th>Spécialité</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${surveillances.map(surv => `
                                    <tr>
                                        <td>${formatDate(surv.date_exam)}</td>
                                        <td>${formatTime(surv.horaire)}</td>
                                        <td>${surv.module}</td>
                                        <td>${surv.salle}</td>
                                        <td>${surv.specialite}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ` : '<p>Aucune surveillance enregistrée</p>'}
                    </div>
                    <script>
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    });
  
      modal.addEventListener('click', (e) => {
          if (e.target === modal.querySelector('.modal-overlay')) {
              modal.remove();
          }
      });
  
      // Show modal
      modal.querySelector('.modal-overlay').style.display = 'flex';
  }

  // Helper function to format date as DD/MM/YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format time as HH:MM (remove seconds)
function formatTime(timeString) {
  return timeString.substring(0, 5); // Takes first 5 characters (HH:MM)
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




  document.getElementById('sendEmailsBtn').addEventListener('click', async function() {
    const sendBtn = document.getElementById('sendEmailsBtn');
    const originalContent = sendBtn.innerHTML;
    
    try {
        // Afficher la boîte de confirmation
        const confirmation = await Swal.fire({
            title: 'Confirmation',
            text: 'Êtes-vous sûr de vouloir envoyer les emplois de surveillances et PVs à tous les enseignants ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, envoyer',
            cancelButtonText: 'Annuler'
        });
  
        // Si l'utilisateur annule, on ne fait rien
        if (!confirmation.isConfirmed) {
            return;
        }
  
        // Afficher un indicateur de chargement
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        sendBtn.disabled = true;
  
        // Envoyer la requête au serveur envoyer-mail
        const response = await fetch('http://localhost:3000/envoyer-mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Envoyer la requête au serveur envoyer-PV
        const responsePV = await fetch('http://localhost:3000/envoyer-pv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code_enseignant: code_enseignant // Ajoutez ce paramètre à votre route /envoyer-pv
          })
        });
  
        const result = await response.json();

        const resultPV = await responsePV.json();
  
        if (result.success && resultPV.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Les emplois de surveillances et PVs ont été envoyés avec succès à tous les enseignants !',
                confirmButtonText: 'OK'
            });
        }else if (result.success && !resultPV.success) {
            await Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de l\'envoi PVs',
              confirmButtonText: 'OK'
            });
        }else if (!result.success && resultPV.success) {
            await Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Erreur lors de l\'envoi des emplois de surveillances',
              confirmButtonText: 'OK'
            });
          
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: result.message || 'Erreur lors de l\'envoi des emplois de surveillances et PVs',
                confirmButtonText: 'OK'
            });
        }
      } catch (error) {
        console.error('Erreur:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur s\'est produite lors de l\'envoi des emplois de surveillances et PVs',
            confirmButtonText: 'OK'
        });
      } finally {
        // Réinitialiser le bouton
        sendBtn.innerHTML = originalContent;
        sendBtn.disabled = false;
      }
  });

  document.addEventListener('DOMContentLoaded', function() {
    // Add confirmation for logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                e.preventDefault();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const userProfile = document.getElementById('userProfile');
  
  // Toggle dropdown
  userProfile.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
      userProfile.classList.remove('active');
  });
  
  // Prevent dropdown from closing when clicking inside
  const dropdown = document.querySelector('.profile-dropdown');
  dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
  });
});