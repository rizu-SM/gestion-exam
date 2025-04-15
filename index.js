let formationsData = [];
        let currentExams = [];




    
        // Charger les données au démarrage
        document.addEventListener('DOMContentLoaded', function() {
            loadFormations();
            loadExamens();
            setupModal();
            setupSemesterFilter();
            setupEditModal();
        });
    
        // Charger les formations depuis le backend
        async function loadFormations() {
            try {
                const response = await fetch('http://localhost:3000/envoyer-formation');
                formationsData = await response.json();
                setupPalierDropdown();
                setupEditPalierDropdown();
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors du chargement des formations');
            }
        }
    
        // Charger les examens depuis le backend
        async function loadExamens() {
            try {
                const response = await fetch('http://localhost:3000/examens');
                currentExams = await response.json();
                displayExamens(currentExams);
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors du chargement des examens');
            }
        }
    
        // Afficher les examens dans le tableau principal
        function displayExamens(examens) {
            const tbody = document.querySelector("#examTable tbody");
            tbody.innerHTML = '';
            
            if (examens.length === 0) {
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 9;
                cell.textContent = 'Aucun examen à afficher';
                return;
            }
    
            examens.forEach(examen => {
                const row = tbody.insertRow();
                
                // Formater la date pour l'affichage
                const dateExam = examen.date_exam.split('T')[0];
                
                // Ajouter les cellules avec les données
                const cells = [
                    examen.semestre,
                    examen.palier,
                    examen.specialite,
                    examen.module,
                    examen.section,
                    dateExam,
                    examen.horaire,
                    examen.salle
                ];
                
                cells.forEach(text => {
                    const cell = row.insertCell();
                    cell.textContent = text;
                });
    
                // Cellule d'actions
                const actionCell = row.insertCell();
                actionCell.className = 'action-cell';
    
                // Bouton Modifier
                const modifyBtn = document.createElement("button");
                modifyBtn.textContent = "Modifier";
                modifyBtn.className = "btn-modifier";
                modifyBtn.onclick = () => editExam(examen.id);
    
                // Bouton Supprimer
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Supprimer";
                deleteBtn.className = "btn-supprimer";
                deleteBtn.onclick = async () => {
                    if (confirm("Voulez-vous vraiment supprimer cet examen ?")) {
                        try {
                            const response = await fetch(`http://localhost:3000/supprimer-examen/${examen.id}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();
                            alert(result.message);
                            loadExamens(); // Recharger la liste
                        } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de la suppression');
                        }
                    }
                };
    
                actionCell.appendChild(modifyBtn);
                actionCell.appendChild(deleteBtn);
            });
        }
    
        // Configurer les dropdowns de palier/spécialité/module pour l'ajout
        function setupPalierDropdown() {
            const palierSelect = document.getElementById('palier');
            const paliers = new Set(formationsData.map(formation => formation.palier));
            palierSelect.innerHTML = '<option value="">Sélectionner</option>';
            paliers.forEach(palier => {
                const option = new Option(palier, palier);
                palierSelect.add(option);
            });
        }
        
        // Configurer les dropdowns de palier/spécialité/module pour l'édition
        function setupEditPalierDropdown() {
            const palierSelect = document.getElementById('edit-palier');
            const paliers = new Set(formationsData.map(formation => formation.palier));
            palierSelect.innerHTML = '<option value="">Sélectionner</option>';
            paliers.forEach(palier => {
                const option = new Option(palier, palier);
                palierSelect.add(option);
            });
        }
    
        // Configurer le filtre par semestre
        function setupSemesterFilter() {
            document.getElementById('semester').addEventListener('change', function() {
                const selectedSemester = this.value;
                const filteredExams = selectedSemester === 'all' 
                    ? currentExams 
                    : currentExams.filter(exam => exam.semestre.toLowerCase() === selectedSemester);
                displayExamens(filteredExams);
            });
        }
    
        // Configurer la modale d'ajout
        function setupModal() {
            const modal = document.getElementById("modal");
            const openModalBtn = document.getElementById("openModalBtn");
            const closeModal = document.querySelector("#modal .close");
    
            // Gestion de l'ouverture/fermeture
            openModalBtn.onclick = () => modal.style.display = "flex";
            closeModal.onclick = () => modal.style.display = "none";
    
            // Gestion des dépendances entre dropdowns
            document.getElementById('palier').addEventListener('change', function() {
                const selectedPalier = this.value;
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
                const selectedSession = document.getElementById('semester').value;
                const moduleSelect = document.getElementById('module');
                
                moduleSelect.innerHTML = '<option value="">Sélectionner</option>';
                moduleSelect.disabled = true;
    
                if (selectedPalier && selectedSpecialite) {
                    const sessionGroup = selectedSession.startsWith('s') 
                        ? ['S1', 'R1'] 
                        : ['S2', 'R2'];
    
                    const modules = new Set(
                        formationsData
                            .filter(formation => 
                                formation.palier === selectedPalier &&
                                formation.specialite === selectedSpecialite &&
                                sessionGroup.includes(formation.session)
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
    
            // Gestion de l'ajout d'un examen
            document.getElementById("ajouter").onclick = async function() {
                const semestre = document.getElementById("semester").value;
                const palier = document.getElementById("palier").value;
                const specialite = document.getElementById("specialite").value;
                const module = document.getElementById("module").value;
                const section = document.getElementById("section").value;
                const date = document.getElementById("date").value;
                const heure = document.getElementById("heure").value;
                const salle = document.getElementById("salle").value;
    
                if (!palier || !specialite || !module || !date || !heure || !salle || !semestre) {
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
                        // Recharger tous les examens
                        await loadExamens();
                        
                        // Réinitialiser le formulaire
                        modal.style.display = "none";
                        resetForm();
                    } else {
                        alert(data.message || "Erreur lors de l'ajout");
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    alert("Erreur lors de l'envoi des données");
                }
            };
        }
    
        // Configurer la modale d'édition
        function setupEditModal() {
            const editModal = document.getElementById("editModal");
            
            // Gestion des dépendances entre dropdowns
            document.getElementById('edit-palier').addEventListener('change', function() {
                const selectedPalier = this.value;
                const specialiteSelect = document.getElementById('edit-specialite');
                
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
    
            document.getElementById('edit-specialite').addEventListener('change', function() {
                const selectedPalier = document.getElementById('edit-palier').value;
                const selectedSpecialite = this.value;
                const selectedSession = document.getElementById('edit-semester').value;
                const moduleSelect = document.getElementById('edit-module');
                
                moduleSelect.innerHTML = '<option value="">Sélectionner</option>';
                moduleSelect.disabled = true;
    
                if (selectedPalier && selectedSpecialite) {
                    const sessionGroup = selectedSession.startsWith('s') 
                        ? ['S1', 'R1'] 
                        : ['S2', 'R2'];
    
                    const modules = new Set(
                        formationsData
                            .filter(formation => 
                                formation.palier === selectedPalier &&
                                formation.specialite === selectedSpecialite &&
                                sessionGroup.includes(formation.session)
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
    
            // Gestion de l'enregistrement des modifications
            document.getElementById("saveEditBtn").onclick = async function() {
                const id = document.getElementById("edit-id").value;
                const semestre = document.getElementById("edit-semester").value;
                const palier = document.getElementById("edit-palier").value;
                const specialite = document.getElementById("edit-specialite").value;
                const module = document.getElementById("edit-module").value;
                const section = document.getElementById("edit-section").value;
                const date = document.getElementById("edit-date").value;
                const heure = document.getElementById("edit-heure").value;
                const salle = document.getElementById("edit-salle").value;
    
                if (!palier || !specialite || !module || !date || !heure || !salle || !semestre) {
                    alert('Veuillez remplir tous les champs obligatoires.');
                    return;
                }
    
                try {
                    const response = await fetch(`http://localhost:3000/modifier-examen/${id}`, {
                        method: 'PUT',
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
                        // Recharger tous les examens
                        await loadExamens();
                        
                        // Fermer la modale
                        closeEditModal();
                    } else {
                        alert(data.message || "Erreur lors de la modification");
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    alert("Erreur lors de l'envoi des données");
                }
            };
        }
    
        // Réinitialiser le formulaire d'ajout
        function resetForm() {
            document.getElementById("date").value = "";
            document.getElementById("heure").value = "";
            document.getElementById("salle").value = "";
            document.getElementById("palier").value = "";
            document.getElementById("specialite").innerHTML = "<option value=''>Sélectionner</option>";
            document.getElementById("module").innerHTML = "<option value=''>Sélectionner</option>";
            document.getElementById("specialite").disabled = true;
            document.getElementById("module").disabled = true;
            document.getElementById("section").value = "";
        }
    
        // Fonction pour ouvrir la modale de modification
        function openEditModal(examen) {
            const modal = document.getElementById("editModal");
            
            // Pré-remplir les champs
            document.getElementById("edit-id").value = examen.id;
            document.getElementById("edit-semester").value = examen.semestre.toLowerCase();
            document.getElementById("edit-palier").value = examen.palier;
            
            // Remplir spécialité
            const specialiteSelect = document.getElementById("edit-specialite");
            specialiteSelect.innerHTML = `<option value="${examen.specialite}">${examen.specialite}</option>`;
            specialiteSelect.disabled = false;
            
            // Remplir module
            const moduleSelect = document.getElementById("edit-module");
            moduleSelect.innerHTML = `<option value="${examen.module}">${examen.module}</option>`;
            moduleSelect.disabled = false;
            
            document.getElementById("edit-section").value = examen.section;
            document.getElementById("edit-date").value = examen.date_exam.split('T')[0];
            document.getElementById("edit-heure").value = examen.horaire;
            document.getElementById("edit-salle").value = examen.salle;
            
            // Ouvrir la modale
            modal.style.display = "flex";
        }
    
        // Fonction pour fermer la modale de modification
        function closeEditModal() {
            document.getElementById("editModal").style.display = "none";
        }
    
        // Fonction pour modifier un examen
        async function editExam(id) {
            const examen = currentExams.find(e => e.id == id);
            if (examen) {
                openEditModal(examen);
            }
        }