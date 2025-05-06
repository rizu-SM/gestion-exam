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
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur : ID de l\'examen introuvable.',
            confirmButtonText: 'OK'
        });
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
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Tous les champs sont obligatoires.',
            confirmButtonText: 'OK'
        });
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
            await Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Examen modifié avec succès !',
                confirmButtonText: 'OK'
            });
            closeEditModal();
            loadExamens(); // Reload the table
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de la modification',
                confirmButtonText: 'OK'
            });
            alert(result.message || "Erreur lors de la modification");
        }
    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la modification',
            confirmButtonText: 'OK'
        });
    }
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
                await Swal.fire({
                    icon: 'success',
                    title: 'Succès',
                    text: 'Examen ajouté avec succès!',
                    confirmButtonText: 'OK'
                });
                resetForm();
                loadExamens(); // Refresh the table
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Erreur lors de l\'ajout',
                    confirmButtonText: 'OK'
                });
                alert(data.message || "Erreur lors de l'ajout");
            }
        } catch (error) {
            console.error('Erreur:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de l\'envoi des données',
                confirmButtonText: 'OK'
            });
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
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors du chargement des formations',
            confirmButtonText: 'OK'
        });
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
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors du chargement des examens',
            confirmButtonText: 'OK'
        });
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

        // Add cells for each column in the new order
        const cells = [
            examen.palier, // Palier
            examen.specialite, // Spécialité
            examen.module,
            examen.section,
            examen.date_exam.split('T')[0], // Format date
            examen.horaire,
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
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de la suppression:',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Load exams on page load
document.addEventListener('DOMContentLoaded', loadExamens);

// Vérification
document.getElementById('verifyBtn').addEventListener('click', async function() {
    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Verifying...';
    verifyBtn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/verifier-erreurs-examens');
        const data = await response.json();
        
        const errorResults = document.getElementById('errorResults');
        const errorModal = document.getElementById('errorModal');
        
        if (data.success || data.erreurs.length === 0) {
            errorResults.innerHTML = `
                <div class="no-errors">
                    <i class="fas fa-check-circle"></i>
                    <h3>Aucune erreur détectée</h3>
                    <p>Tous les examens sont correctement programmés sans conflits.</p>
                </div>
            `;
        } else {
            errorResults.innerHTML = `
                <div class="alert alert-warning mb-3">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    ${data.erreurs.length} problème(s) de planification ont été trouvés.
                </div>
                <div class="table-responsive">
                    <table class="error-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Examens concernés</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.erreurs.map(error => `
                                <tr>
                                    <td>
                                        <span class="error-badge ${
                                            error.type && error.type.includes('Conflit') ? 'badge-conflict' : 
                                            error.type && error.type.includes('Doublon') ? 'badge-warning' : 'badge-danger'
                                        }">
                                            ${error.type || ''}
                                        </span>
                                    </td>
                                    <td>${error.message || ''}</td>
                                    <td>
                                        <div class="exam-ids">
                                            ${(error.examens || [error.examen]).map(id => `
                                                <span class="exam-id">#${id}</span>
                                            `).join('')}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        errorModal.style.display = 'flex';
    } catch (error) {
        console.error('Verification failed:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Failed to verify exams. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verifier';
        verifyBtn.disabled = false;
    }
});

function openSubmitModal() {
    // 1. Vérification avant ouverture
    fetch('http://localhost:3000/verifier-erreurs-examens')
        .then(res => res.json())
        .then(data => {
            if (!data.success && data.erreurs && data.erreurs.length > 0) {
                // Afficher le modal d'erreur
                showErrorModal(data.erreurs);
            } else {
                // Ouvrir le modal de soumission
                document.getElementById('submitModal').style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        })
        .catch(() => alert("Erreur lors de la vérification.")
        );
}

function closeSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Error modal helpers
function showErrorModal(erreurs) {
    const modal = document.getElementById('errorModal');
    const results = document.getElementById('errorResults');
    if (!Array.isArray(erreurs) || erreurs.length === 0) {
        results.innerHTML = `<div class="no-errors">
            <i class="fas fa-check-circle"></i>
            <h3>Aucune erreur détectée</h3>
            <p>Tous les examens sont correctement programmés sans conflits.</p>
        </div>`;
    } else {
        results.innerHTML = `
            <div class="alert alert-warning mb-3">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ${erreurs.length} problème(s) de planification ont été trouvés.
            </div>
            <div class="table-responsive">
                <table class="error-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Examens concernés</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${erreurs.map(error => `
                            <tr>
                                <td>
                                    <span class="error-badge ${
                                        error.type && error.type.includes('Conflit') ? 'badge-conflict' : 
                                        error.type && error.type.includes('Doublon') ? 'badge-warning' : 'badge-danger'
                                    }">
                                        ${error.type || ''}
                                    </span>
                                </td>
                                <td>${error.message || ''}</td>
                                <td>
                                    <div class="exam-ids">
                                        ${(error.examens || [error.examen]).map(id => `
                                            <span class="exam-id">#${id}</span>
                                        `).join('')}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}
document.getElementById('closeErrorModal').onclick = closeErrorModal;
document.getElementById('closeModalBtn').onclick = closeErrorModal;

// "Confirmer" button logic
document.getElementById('confirmSubmitBtn').addEventListener('click', async function () {
    const semestre = document.getElementById('semestre').value;
    const pourcentagePermanent = parseInt(document.getElementById('surveillance-percentage').value, 10) || 0;
    const envoyerEmails = document.getElementById('submit-sendemail').checked;

    // 1. Exporter exam_temp -> exam
    try {
        const exportRes = await fetch('http://localhost:3000/export-examens', { method: 'POST' });
        const exportData = await exportRes.json();
        if (!exportData.success) {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de l\'exportation des examens.',
                confirmButtonText: 'OK'
            });
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de l\'exportation des examens.',
                confirmButtonText: 'OK'
            });
            alert(exportData.message || "Erreur lors de l'exportation des examens.");
            return;
        }
    } catch (e) {
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de l\'exportation des examens.',
            confirmButtonText: 'OK'
        });
        alert("Erreur lors de l'exportation des examens.");
        return;
    }

    // 2. Appeler /gestion-surveillances
    try {
        const surveilRes = await fetch('http://localhost:3000/gestion-surveillances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semestre, pourcentagePermanent })
        });
        const surveilData = await surveilRes.json();
        if (!surveilData.success) {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de la gestion des surveillances.',
                confirmButtonText: 'OK'
            });
            alert(surveilData.message || "Erreur lors de la gestion des surveillances.");
            return;
        }
    } catch (e) {
        await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la gestion des surveillances.',
            confirmButtonText: 'OK'
        });
        return;
    }

    // 3. Envoyer les emails si demandé
    if (envoyerEmails) {
        try {
            const emailRes = await fetch('http://localhost:3000/envoyer-mail', { method: 'POST' });
            const emailData = await emailRes.json();
            if (!emailData.success) {
                alert(emailData.message || "Erreur lors de l'envoi des emails.");
            }
            // Envoyer aussi les PV
            const pvRes = await fetch('http://localhost:3000/envoyer-pv', { method: 'POST' });
            const pvData = await pvRes.json();
            if (!pvData.success) {
                alert(pvData.message || "Erreur lors de l'envoi des PV.");
            }
        } catch (e) {
            await Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de l\'envoi des emails ou des PV.',
                confirmButtonText: 'OK'
            });
        }
    }
    await Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Examens soumis et surveillances générées avec succès !',
        confirmButtonText: 'OK'
    });
    closeSubmitModal();
    loadExamens();
});
// Remplacer l'ancien onclick dans le HTML par openSubmitModal()

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