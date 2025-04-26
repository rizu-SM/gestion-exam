// document.querySelectorAll('.session-btn').forEach(btn => {
//     btn.addEventListener('click', function() {
//         document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
//         this.classList.add('active');
//         // Ici vous pourriez charger les données de la session sélectionnée
//     });
// });

// function closeEditModal() {
//     document.getElementById('editModal').style.display = 'none';
//     document.body.style.overflow = 'auto';
// }

// // Open the edit modal and populate it with the selected exam's data
// function openEditModal(examId) {
//     // Find the exam by its ID
//     const exam = allExams.find(e => e.id === examId);
//     if (!exam) {
//         alert("Examen introuvable !");
//         return;
//     }

//     // Set the examId in the modal's dataset
//     document.getElementById('editModal').dataset.examId = examId;

//     // Populate the fields
//     document.getElementById('edit-palier').value = exam.palier; 
//     document.getElementById('edit-specialite').value = exam.specialite; 
//     document.getElementById('edit-module').value = exam.module;
//     document.getElementById('edit-section').value = exam.section;
//     document.getElementById('edit-date').value = exam.date_exam.split('T')[0]; // Format date
//     document.getElementById('edit-heure').value = exam.horaire;
//     document.getElementById('edit-salle').value = exam.salle;

//     // Show the modal
//     document.getElementById('editModal').style.display = 'flex';
//     document.body.style.overflow = 'hidden';
// }

// // Save the modified exam
// document.getElementById('saveEditBtn').addEventListener('click', async function () {
//     const examId = document.getElementById('editModal').dataset.examId; // Retrieve the exam ID
//     if (!examId) {
//         alert("Erreur : ID de l'examen introuvable.");
//         return;
//     }

//     const palier = document.getElementById('edit-palier').value;
//     const specialite = document.getElementById('edit-specialite').value; 
//     const module = document.getElementById('edit-module').value;
//     const section = document.getElementById('edit-section').value;
//     const date_exam = document.getElementById('edit-date').value;
//     const horaire = document.getElementById('edit-heure').value;
//     const salle = document.getElementById('edit-salle').value;

//     if (!palier || !specialite || !section || !module || !date_exam || !horaire || !salle) {
//         alert('Tous les champs sont obligatoires.');
//         return;
//     }

//     try {
//         const response = await fetch(`http://localhost:3000/modifier-examen/${examId}`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 palier,
//                 specialite,
//                 section,
//                 module,
//                 date_exam,
//                 horaire,
//                 salle,
//             })
//         });

//         const result = await response.json();
//         if (result.success) {
//             alert('Examen modifié avec succès !');
//             closeEditModal();
//             loadExamens(); // Reload the table
//         } else {
//             alert(result.message || "Erreur lors de la modification");
//         }
//     } catch (error) {
//         console.error('Erreur lors de la modification:', error);
//         alert("Erreur lors de la modification");
//     }
// });

// // Vérification
// document.getElementById('verifyBtn').addEventListener('click', function() {
//     alert("Vérification en cours...\n\nCette fonction vérifiera les conflits d'emploi du temps.");
// });

// // Soumission
// document.getElementById('submitBtn').addEventListener('click', function() {
//     alert("Soumission réussie!\n\nL'emploi du temps a été confirmé.");
// });

// // Fermer le modal en cliquant à l'extérieur
// document.getElementById('editModal').addEventListener('click', function(e) {
//     if (e.target === this) closeEditModal();
// });

// // Suppression d'un examen
// document.querySelectorAll('.action-btn.delete').forEach(btn => {
//     btn.addEventListener('click', function() {
//         if (confirm("Êtes-vous sûr de vouloir supprimer cet examen ?")) {
//             const row = this.closest('tr');
//             row.remove();
//             alert("Examen supprimé avec succès");
//         }
//     });
// });

// console.log("prblm");

// //-------------------------------------------------------------------------
// //------------------SAMI PARTE------------------------------------------------

// console.log("before fetch");
// document.querySelectorAll('.session-btn').forEach(btn => {
//     btn.addEventListener('click', function() {
//         document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
//         this.classList.add('active');
//         // Vous pouvez charger les données de session ici si nécessaire
//     });
// });

// // Variables globales
// let formationsData = [];
// let currentExams = [];

// // Global variable to store all exams
// let allExams = [];

// // Charger les données au démarrage
// document.addEventListener('DOMContentLoaded', function() {
//     console.log("Initialisation...");
//     loadFormations();
//     loadExamens();
    
//     // Configurer les écouteurs d'événements pour les dropdowns
//     document.getElementById('palier').addEventListener('change', function() {
//         const selectedPalier = this.value;
//         console.log("Palier sélectionné: ", selectedPalier);
//         const specialiteSelect = document.getElementById('specialite');
        
//         specialiteSelect.innerHTML = '<option value="">Sélectionner</option>';
//         specialiteSelect.disabled = true;
    
//         if (selectedPalier) {
//             const specialites = new Set(
//                 formationsData
//                     .filter(formation => formation.palier === selectedPalier)
//                     .map(formation => formation.specialite)
//             );
    
//             specialites.forEach(specialite => {
//                 const option = new Option(specialite, specialite);
//                 specialiteSelect.add(option);
//             });
    
//             specialiteSelect.disabled = false;
//         }
//     });
    
//     document.getElementById('specialite').addEventListener('change', function() {
//         const selectedPalier = document.getElementById('palier').value;
//         const selectedSpecialite = this.value;
//         console.log("Specialité sélectionnée: ", selectedSpecialite);
//         const moduleSelect = document.getElementById('module');
        
//         moduleSelect.innerHTML = '<option value="">Sélectionner</option>';
//         moduleSelect.disabled = true;
    
//         if (selectedPalier && selectedSpecialite) {
//             const modules = new Set(
//                 formationsData
//                     .filter(formation => 
//                         formation.palier === selectedPalier &&
//                         formation.specialite === selectedSpecialite
//                     )
//                     .map(formation => formation.module)
//             );
    
//             modules.forEach(module => {
//                 const option = new Option(module, module);
//                 moduleSelect.add(option);
//             });
    
//             moduleSelect.disabled = modules.size === 0;
//         }
//     });
    
//     // Événement pour le bouton ajouter - CORRECTEMENT PLACÉ
//     document.getElementById("ajouter").addEventListener("click", async function () {
//         const activeSessionBtn = document.querySelector('.session-btn.active');
//         if (!activeSessionBtn) {
//             alert('Veuillez sélectionner une session');
//             return;
//         }
//         const semestre = activeSessionBtn.dataset.semestre; 
        
//         const palier = document.getElementById("palier").value;
//         const specialite = document.getElementById("specialite").value;
//         const module = document.getElementById("module").value;
//         const section = document.getElementById("section").value;
//         const date = document.getElementById("date").value;
//         const heure = document.getElementById("heure").value;
//         const salle = document.getElementById("salle").value;
    
//         if (!palier || !specialite || !module || !date || !heure || !salle || !section) {
//             alert('Veuillez remplir tous les champs obligatoires.');
//             return;
//         }
    
//         try {
//             const response = await fetch('http://localhost:3000/ajouter-examen', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     palier,
//                     specialite,
//                     section,
//                     module,
//                     date,
//                     heure,
//                     salle,
//                     semestre
//                 })
//             });
    
//             const data = await response.json();
    
//             if (data.success) {
//                 alert('Examen ajouté avec succès!');
//                 resetForm();
//                 loadExamens(); // Refresh the table
//             } else {
//                 alert(data.message || "Erreur lors de l'ajout");
//             }
//         } catch (error) {
//             console.error('Erreur:', error);
//             alert("Erreur lors de l'envoi des données");
//         }
//     });
// });

// // Charger les formations depuis le backend
// async function loadFormations() {
//     console.log('Tentative de récupération des formations...');
//     try {
//         const response = await fetch('http://localhost:3000/envoyer-formation');
//         console.log('Réponse reçue:', response);
//         formationsData = await response.json();
//         setupPalierDropdown();
//     } catch (error) {
//         console.error('Erreur dans loadFormations:', error);
//         alert('Erreur lors du chargement des formations');
//     }
// }

// // Configurer les dropdowns de palier
// function setupPalierDropdown() {
//     const palierSelect = document.getElementById('palier');
//     const paliers = new Set(formationsData.map(formation => formation.palier));
//     palierSelect.innerHTML = '<option value="">Sélectionner</option>';
//     paliers.forEach(palier => {
//         const option = new Option(palier, palier);
//         palierSelect.add(option);
//     });
// }

// function resetForm() {
//     document.getElementById("section").value = "";
//     document.getElementById("date").value = "";
//     document.getElementById("heure").value = "";
//     document.getElementById("salle").value = "";
//     // Réinitialiser les selects si nécessaire
// }

// // Fetch and display exams in the table
// async function loadExamens() {
//     try {
//         const response = await fetch('http://localhost:3000/examens');
//         allExams = await response.json(); // Store all exams globally

//         // Get the active session
//         const activeSessionBtn = document.querySelector('.session-btn.active');
//         if (activeSessionBtn) {
//             const activeSession = activeSessionBtn.dataset.semestre;
//             filterExamsBySession(activeSession); // Filter exams by the active session
//         } else {
//             displayExamens(allExams); // Display all exams if no session is selected
//         }
//     } catch (error) {
//         console.error('Erreur lors du chargement des examens:', error);
//         alert('Erreur lors du chargement des examens');
//     }
// }

// // Filter exams by session
// function filterExamsBySession(session) {
//     const filteredExams = allExams.filter(exam => exam.semestre === session);
//     displayExamens(filteredExams);
// }

// // Populate the table with exam data
// function displayExamens(examens) {
//     const tbody = document.querySelector('.table-container tbody');
//     tbody.innerHTML = ''; // Clear existing rows

//     if (examens.length === 0) {
//         const row = tbody.insertRow();
//         const cell = row.insertCell();
//         cell.colSpan = 8; // Adjust based on the number of columns
//         cell.textContent = 'Aucun examen à afficher';
//         return;
//     }

//     examens.forEach(examen => {
//         const row = tbody.insertRow();

//         // Add cells for each column in the new order
//         const cells = [
//             examen.palier, // Palier
//             examen.specialite, // Spécialité
//             examen.module,
//             examen.section,
//             examen.date_exam.split('T')[0], // Format date
//             examen.horaire,
//             examen.salle,
//         ];

//         cells.forEach(text => {
//             const cell = row.insertCell();
//             cell.textContent = text;
//         });

//         // Add action buttons
//         const actionCell = row.insertCell();
//         actionCell.innerHTML = `
//             <button class="action-btn edit" title="Modifier" onclick="openEditModal(${examen.id})">
//                 <i class="fas fa-edit"></i>
//             </button>
//             <button class="action-btn delete" title="Supprimer" onclick="deleteExam(${examen.id})">
//                 <i class="fas fa-trash"></i>
//             </button>
//         `;
//     });
// }

// // Event listener for session buttons
// document.querySelectorAll('.session-btn').forEach(btn => {
//     btn.addEventListener('click', function () {
//         document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
//         this.classList.add('active');
//         const session = this.dataset.semestre; // Get the session from the button's data attribute
//         filterExamsBySession(session); // Filter exams by the selected session
//     });
// });

// // Delete an exam
// async function deleteExam(id) {
//     if (confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
//         try {
//             const response = await fetch(`http://localhost:3000/supprimer-examen/${id}`, {
//                 method: 'DELETE'
//             });
//             const result = await response.json();
//             alert(result.message);
//             loadExamens(); // Reload the table
//         } catch (error) {
//             console.error('Erreur lors de la suppression:', error);
//             alert('Erreur lors de la suppression');
//         }
//     }
// }

// // Load exams on page load
// document.addEventListener('DOMContentLoaded', loadExamens);















document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Ici vous pourriez charger les données de la session sélectionnée
    });
});

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Open the edit modal and populate it with the selected exam's data
function openEditModal(examId) {
    // Find the exam by its ID
    const exam = allExams.find(e => e.id === examId);
    if (!exam) {
        alert("Examen introuvable !");
        return;
    }

    // Set the examId in the modal's dataset
    document.getElementById('editModal').dataset.examId = examId;

    // Populate the fields
    document.getElementById('edit-palier').value = exam.palier; 
    document.getElementById('edit-specialite').value = exam.specialite; 
    document.getElementById('edit-module').value = exam.module;
    document.getElementById('edit-section').value = exam.section;
    // Format the date without timezone adjustments
    const date = new Date(exam.date_exam);
    const formattedDate = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    document.getElementById('edit-date').value = formattedDate;
    document.getElementById('edit-heure').value = exam.horaire;
    document.getElementById('edit-salle').value = exam.salle;

    // Show the modal
    document.getElementById('editModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Save the modified exam
document.getElementById('saveEditBtn').addEventListener('click', async function () {
    const examId = document.getElementById('editModal').dataset.examId; // Retrieve the exam ID
    if (!examId) {
        alert("Erreur : ID de l'examen introuvable.");
        return;
    }

    const palier = document.getElementById('edit-palier').value;
    const specialite = document.getElementById('edit-specialite').value; 
    const module = document.getElementById('edit-module').value;
    const section = document.getElementById('edit-section').value;
    const date_exam = document.getElementById('edit-date').value;
    const horaire = document.getElementById('edit-heure').value;
    const salle = document.getElementById('edit-salle').value;

    if (!palier || !specialite || !section || !module || !date_exam || !horaire || !salle) {
        alert('Tous les champs sont obligatoires.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/modifier-examen/${examId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                palier,
                specialite,
                section,
                module,
                date_exam,
                horaire,
                salle,
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('Examen modifié avec succès !');
            closeEditModal();
            loadExamens(); // Reload the table
        } else {
            alert(result.message || "Erreur lors de la modification");
        }
    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        alert("Erreur lors de la modification");
    }
});

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

function initFilters() {
    const palierSelect = document.getElementById('palier');
    const specialiteSelect = document.getElementById('specialite');
    const moduleSelect = document.getElementById('module');
    const sessionButtons = document.querySelectorAll('.session-btn');

    // Remplir le palier
    const paliers = [...new Set(formationsData.map(f => f.palier))];
    paliers.forEach(p => palierSelect.add(new Option(p, p)));

    // Écouteur pour les boutons de session
    sessionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            sessionButtons.forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            // Mettre à jour les modules
            updateModules();
        });
    });

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

    specialiteSelect.addEventListener('change', updateModules);

    function updateModules() {
        // Récupérer la session active
        const activeSessionBtn = document.querySelector('.session-btn.active');
        const semestreValue = activeSessionBtn ? activeSessionBtn.dataset.semestre : null;
        
        const hasAllRequired = palierSelect.value && specialiteSelect.value && semestreValue;
        moduleSelect.disabled = !hasAllRequired;
        
        if (!hasAllRequired) {
            moduleSelect.innerHTML = '<option value="">Sélectionnez d\'abord les filtres</option>';
            return;
        }

        // Déterminer la session cible
        let targetSession;
        if (semestreValue.startsWith('R1') || semestreValue === 'S1') {
            targetSession = 'S1';
        } else if (semestreValue.startsWith('R2') || semestreValue === 'S2') {
            targetSession = 'S2';
        }

        // Filtrer modules
        const modules = [...new Set(
            formationsData
                .filter(f => 
                    f.palier === palierSelect.value &&
                    f.specialite === specialiteSelect.value &&
                    f.session === targetSession
                )
                .map(f => f.module)
        )];
        
        moduleSelect.innerHTML = '<option value="">Tous les modules</option>';
        modules.forEach(m => moduleSelect.add(new Option(m, m)));
    }

    // Initialiser les modules au chargement
    updateModules();
}

// Variables globales
let formationsData = [];
let currentExams = [];

// Global variable to store all exams
let allExams = [];

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation...");
    loadFormations();
    loadExamens();
    initFilters();
    
    // Configurer les écouteurs d'événements pour les dropdowns
    // document.getElementById('palier').addEventListener('change', function() {
    //     const selectedPalier = this.value;
    //     console.log("Palier sélectionné: ", selectedPalier);
    //     const specialiteSelect = document.getElementById('specialite');
        
    //     specialiteSelect.innerHTML = '<option value="">Sélectionner</option>';
    //     specialiteSelect.disabled = true;
    
    //     if (selectedPalier) {
    //         const specialites = new Set(
    //             formationsData
    //                 .filter(formation => formation.palier === selectedPalier)
    //                 .map(formation => formation.specialite)
    //         );
    
    //         specialites.forEach(specialite => {
    //             const option = new Option(specialite, specialite);
    //             specialiteSelect.add(option);
    //         });
    
    //         specialiteSelect.disabled = false;
    //     }
    // });
    
    // document.getElementById('specialite').addEventListener('change', function() {
    //     const selectedPalier = document.getElementById('palier').value;
    //     const selectedSpecialite = this.value;
    //     console.log("Specialité sélectionnée: ", selectedSpecialite);
    //     const moduleSelect = document.getElementById('module');
        
    //     moduleSelect.innerHTML = '<option value="">Sélectionner</option>';
    //     moduleSelect.disabled = true;
    
    //     if (selectedPalier && selectedSpecialite) {
    //         const modules = new Set(
    //             formationsData
    //                 .filter(formation => 
    //                     formation.palier === selectedPalier &&
    //                     formation.specialite === selectedSpecialite
    //                 )
    //                 .map(formation => formation.module)
    //         );
    
    //         modules.forEach(module => {
    //             const option = new Option(module, module);
    //             moduleSelect.add(option);
    //         });
    
    //         moduleSelect.disabled = modules.size === 0;
    //     }
    // });
    
    // Événement pour le bouton ajouter - CORRECTEMENT PLACÉ
    document.getElementById("ajouter").addEventListener("click", async function () {
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
                loadExamens(); // Refresh the table
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

// Fetch and display exams in the table
async function loadExamens() {
    try {
        const response = await fetch('http://localhost:3000/examens');
        allExams = await response.json(); // Store all exams globally

        // Get the active session
        const activeSessionBtn = document.querySelector('.session-btn.active');
        if (activeSessionBtn) {
            const activeSession = activeSessionBtn.dataset.semestre;
            filterExamsBySession(activeSession); // Filter exams by the active session
        } else {
            displayExamens(allExams); // Display all exams if no session is selected
        }
    } catch (error) {
        console.error('Erreur lors du chargement des examens:', error);
        alert('Erreur lors du chargement des examens');
    }
}

// Filter exams by session
function filterExamsBySession(session) {
    const filteredExams = allExams.filter(exam => exam.semestre === session);
    displayExamens(filteredExams);
}

// Populate the table with exam data
function displayExamens(examens) {
    const tbody = document.querySelector('.table-container tbody');
    tbody.innerHTML = ''; // Clear existing rows

    if (examens.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8; // Adjust based on the number of columns
        cell.textContent = 'Aucun examen à afficher';
        return;
    }

    examens.forEach(examen => {
        const row = tbody.insertRow();

        // Format the date as DD/MM/YYYY
        const formattedDate = formatDate(examen.date_exam.split('T')[0]);
        // Format time (08:00:00 → 08:00)
        const formattedTime = formatTime(examen.horaire);

        // Use the date as received from the backend without modifications
        // const date = examen.date_exam.split('T')[0];

        // Add cells for each column in the new order
        const cells = [
            examen.palier, // Palier
            examen.specialite, // Spécialité
            examen.module,
            examen.section,
            formattedDate, // Use the unmodified date
            formattedTime,
            examen.salle,
        ];

        cells.forEach(text => {
            const cell = row.insertCell();
            cell.textContent = text;
        });

        // Add action buttons
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <button class="action-btn edit" title="Modifier" onclick="openEditModal(${examen.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" title="Supprimer" onclick="deleteExam(${examen.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    });
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

// Event listener for session buttons
document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const session = this.dataset.semestre; // Get the session from the button's data attribute
        filterExamsBySession(session); // Filter exams by the selected session
    });
});

// Delete an exam
async function deleteExam(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
        try {
            const response = await fetch(`http://localhost:3000/supprimer-examen/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            alert(result.message);
            loadExamens(); // Reload the table
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }
}

// Load exams on page load
document.addEventListener('DOMContentLoaded', loadExamens);



// Function to open the submit modal
function openSubmitModal() {
    const modal = document.getElementById('submitModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

// Function to close the submit modal
function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Add event listener to the submit button
document.getElementById('submitBtn').addEventListener('click', openSubmitModal);

// Close modal when clicking outside of it
document.getElementById('submitModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSubmitModal();
    }
});