document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Ici vous pourriez charger les données de la session sélectionnée
    });
});


document.addEventListener('DOMContentLoaded', function() {
  const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  }
  if (enseignant.nom && enseignant.prenom && enseignant.email1) {
    const nom = capitalize(enseignant.nom);
    const prenom = capitalize(enseignant.prenom);
    // Update header greeting
    document.querySelector('.header h1').textContent = `Bonjour Prof. ${nom} ${prenom}`;
    // Update user-avatar (initials)
    const initials = (prenom[0] || '') + (nom[0] || '');
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials.toUpperCase());
    // Update user-name
    const userName = document.querySelector('.user-name');
    if (userName) userName.textContent = `${nom} ${prenom}`;
    // Update user-email
    const userEmail = document.querySelector('.user-email');
    if (userEmail) userEmail.textContent = enseignant.email1;
    // Update user-profile short name
    const userProfileName = document.querySelector('#userProfile span');
    if (userProfileName) userProfileName.textContent = `Prof. ${nom}`;
  }
});

// View buttons - Exam Details Modal
    const viewButtons = document.querySelectorAll('.action-btn.view');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const examId = this.closest('tr').getAttribute('data-exam-id');
            showExamDetails(examId, surveillance);
        });
    });

    // Modal controls
    const examModal = document.getElementById('examModal');
    const closeBtn = document.getElementById('closeModalBtn');
    
    closeBtn.addEventListener('click', closeModal);
    examModal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Print button
    document.getElementById('printBtn').addEventListener('click', function() {
        window.print();
    });



document.addEventListener('DOMContentLoaded', function() {
            // Show/hide request form
            const showFormButtons = document.querySelectorAll('.btn.btn-primary');
            const requestForm = document.getElementById('requestForm');
            const cancelButton = document.getElementById('cancelRequest');
            
            showFormButtons.forEach(button => {
                button.addEventListener('click', function() {
                    requestForm.style.display = 'block';
                    // Scroll to form
                    requestForm.scrollIntoView({ behavior: 'smooth' });
                });
            });
            
            cancelButton.addEventListener('click', function() {
                requestForm.style.display = 'none';
            });
});

document.addEventListener('DOMContentLoaded', function() {
    // === DOM ELEMENTS ===
    const requestType = document.getElementById('requestType');
    const preferredDateGroup = document.getElementById('preferredDateGroup');
    const preferredDate = document.getElementById('preferredDate');
    const colleagueSelectGroup = document.getElementById('colleagueSelectGroup');
    const colleagueSurveillanceGroup = document.getElementById('colleagueSurveillanceGroup');
    const colleagueSurveillanceSelect = document.getElementById('colleagueSurveillanceSelect');
    const colleagueSearch = document.getElementById('colleagueSearch');
    const colleagueResults = document.getElementById('colleagueResults');
    const changeForm = document.getElementById('surveillanceChangeForm');
    const surveillanceSelect = document.getElementById('surveillanceSelect');
    const requestReason = document.getElementById('requestReason');
    const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
    let colleagues = [];

    // === SHOW/HIDE FORM GROUPS BASED ON REQUEST TYPE ===
    requestType.addEventListener('change', function() {
        preferredDateGroup.style.display = 'none';
        colleagueSelectGroup.style.display = 'none';
        colleagueSurveillanceGroup.style.display = 'none';

        if (this.value === 'change') {
            preferredDateGroup.style.display = 'block';
        } else if (this.value === 'swap') {
            colleagueSelectGroup.style.display = 'block';
            colleagueSurveillanceGroup.style.display = 'block';
            // If a colleague is already selected, populate their surveillances
            if (colleagueSearch.dataset.code) {
                populateColleagueSurveillances(colleagueSearch.dataset.code);
            }
        }
    });

    // === AUTOCOMPLETE FOR COLLEAGUES ===
    async function fetchColleagues() {
        if (!enseignant.code_enseignant) return [];
        const res = await fetch(`http://localhost:3000/colleagues?exclude=${encodeURIComponent(enseignant.code_enseignant)}`);
        return res.ok ? await res.json() : [];
    }

    colleagueSearch.addEventListener('input', async function() {
    const query = this.value.trim().toLowerCase();
    if (!colleagues.length) colleagues = await fetchColleagues();

    colleagueResults.innerHTML = '';
    if (query.length < 1) return;

    const filtered = colleagues.filter(c =>
        c.nom.toLowerCase().includes(query) ||
        c.prenom.toLowerCase().includes(query)
    );

    filtered.forEach(c => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = `Prof. ${capitalize(c.nom)} ${capitalize(c.prenom)}`;
        item.dataset.code = c.code_enseignant;
        colleagueResults.appendChild(item);
    });
});

// Single handler for all autocomplete items (event delegation)
colleagueResults.addEventListener('click', async function(e) {
    if (!e.target.classList.contains('autocomplete-item')) return;
    
    const colleagueCode = e.target.dataset.code;
    colleagueSearch.value = e.target.textContent;
    colleagueSearch.dataset.code = colleagueCode;
    colleagueResults.innerHTML = '';
    
    if (requestType.value === 'swap') {
        colleagueSurveillanceGroup.style.display = 'block';
        await populateColleagueSurveillances(colleagueCode);
    }
});

    // === POPULATE COLLEAGUE'S SURVEILLANCES ===
    async function populateColleagueSurveillances(colleagueCode) {
        colleagueSurveillanceSelect.innerHTML = '<option value="">Sélectionnez une surveillance du collègue</option>';
        // Use the new backend route
        const res = await fetch(`http://localhost:3000/colleagues-enseignant/${encodeURIComponent(colleagueCode)}`);
        const surveillances = await res.json();
        console.log("colleugeues",surveillances);
        surveillances.forEach(surv => {
        const date = formatDate(surv.date_exam);
        const startTime = formatTime(surv.horaire);
        // Assuming each exam is 1.5h (90min)
        const [h, m] = startTime.split(':').map(Number);
        const end = new Date(0, 0, 0, h, m + 90);
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        const label = `${date} - ${surv.module} (${startTime}-${endTime}, ${surv.salle})`;
        const option = document.createElement('option');
        option.value = surv.id;
        option.textContent = label;
        colleagueSurveillanceSelect.appendChild(option);
        });
    }

    // === FORM VALIDATION AND SUBMISSION ===
    changeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!surveillanceSelect.value) {
            alert('Veuillez sélectionner une surveillance');
            surveillanceSelect.focus();
            return;
        }
        if (!requestType.value) {
            alert('Veuillez sélectionner un type de demande');
            requestType.focus();
            return;
        }
        if (!requestReason.value.trim()) {
            alert('Veuillez expliquer le motif de votre demande');
            requestReason.focus();
            return;
        }
        if (requestType.value === 'change' && !preferredDate.value) {
            alert('Veuillez sélectionner une date préférée');
            return;
        }
        if (requestType.value === 'swap') {
            const code = colleagueSearch.dataset.code;
            if (!code) {
                alert('Veuillez sélectionner un collègue dans la liste.');
                return;
            }
            if (!colleagueSurveillanceSelect.value) {
                alert('Veuillez sélectionner une surveillance du collègue');
                return;
            }
        }

        // Prepare data for backend
        const formData = {
            code_enseignant: enseignant.code_enseignant,
            surveillance_id: surveillanceSelect.value,
            type: requestType.value,
            motif: requestReason.value,
            preferred_date: requestType.value === 'change' ? preferredDate.value : null,
            colleague_code: requestType.value === 'swap' ? colleagueSearch.dataset.code : null,
            preferred_surveillance_id: requestType.value === 'swap' ? colleagueSurveillanceSelect.value : null
        };

        try {
            const response = await fetch('http://localhost:3000/insert-demandes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Votre demande a été envoyée avec succès aux administrateurs.');
                changeForm.reset();
                document.getElementById('requestForm').style.display = 'none';
            } else {
                alert(result.error || "Erreur lors de l'envoi de la demande.");
            }
        } catch (err) {
            alert("Erreur réseau ou serveur.");
            console.error(err);
        }
    });

    // === HELPER FUNCTIONS ===
    function capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    }
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    function formatTime(timeString) {
        return timeString.substring(0, 5);
    }

    // === INITIALIZE YOUR SELECTS ===
    populateSurveillanceSelect();
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
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.querySelector('.toggle-button');
    const sidebar = document.querySelector('.sidebar');
    
    toggleButton.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });
});


document.addEventListener('DOMContentLoaded', function() {
    loadAllSurveillances();
    loadAndDisplayMyDemandesCount();
});

async function loadAndDisplayMyDemandesCount() {
    const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
    if (!enseignant.code_enseignant) return;

    try {
        const response = await fetch(`http://localhost:3000/demandes?code_enseignant=${encodeURIComponent(enseignant.code_enseignant)}`);
        if (!response.ok) throw new Error('Erreur de récupération des demandes');
        const demandes = await response.json();

        // Update the third stat card (demandes en attente)
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards[2]) {
            // Count only pending demandes (if you want all, remove the filter)
            const pendingCount = demandes.filter(d => d.status === 'pending').length;
            statCards[2].querySelector('.stat-value').textContent = pendingCount;
            statCards[2].querySelector('.stat-change').textContent = pendingCount === 1 ? "1 nouvelle demande" : `${pendingCount} nouvelles demandes`;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
    }
}

async function loadAllSurveillances() {
    try {
        const response = await fetch('http://localhost:3000/surveillance');
        if (!response.ok) throw new Error('Erreur de récupération des surveillances');
        // return await response.json();
        allSurveillances = await response.json();  // Récupère les données au format JSON
        // Get the active session
        const activeSessionBtn = document.querySelector('.session-btn.active');
        if (activeSessionBtn) {
            const activeSession = activeSessionBtn.dataset.semestre;
            filterExamsBySession(activeSession); // Filter exams by the active session
        } else {
            loadAndDisplayMySurveillances(allSurveillances); // Display all exams if no session is selected
        }
        return await allSurveillances;
    } catch (error) {
        console.error('Erreur lors du chargement des surveillances:', error);
        return [];
    }
}

// Filter exams by session
function filterExamsBySession(session) {
    const filteredSurveillances = allSurveillances.filter(exam => exam.semestre === session);
    loadAndDisplayMySurveillances(filteredSurveillances);
}

async function loadAndDisplayMySurveillances(surveillances) {
    const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
    if (!enseignant.code_enseignant) return;

    // const surveillances = await loadAllSurveillances();
    const tbody = document.querySelector('#proctorAssignmentsTable tbody');
    if (!tbody) return;

    // Filter surveillances for the logged-in enseignant
    const mySurveillances = surveillances.filter(
        s => s.code_enseignant === enseignant.code_enseignant
    );
    console.log(mySurveillances);

    // === UPDATE STAT CARDS ===
    // 1. Total surveillances
    const totalSurveillances = mySurveillances.length;
    // 2. Total hours (1.5h per surveillance)
    const totalHours = (totalSurveillances * 1.5).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    // Update the first stat card (total surveillances)
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards[0]) {
        statCards[0].querySelector('.stat-value').textContent = totalSurveillances;
    }
    // Update the second stat card (total hours)
    if (statCards[1]) {
        statCards[1].querySelector('.stat-value').textContent = totalHours;
        statCards[1].querySelector('.stat-change').textContent = "Moyenne: 1.5h/examen";
    }

    tbody.innerHTML = '';

    if (mySurveillances.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">Pas de Surveillances Assignée.</td>
            </tr>
        `;
        return;
    }

    mySurveillances.forEach(surv => {
        const row = document.createElement('tr');
        row.setAttribute('data-exam-id', surv.id);

        console.log("surv.date_exam", surv.date_exam);
        console.log("surv.horaire", surv.horaire);

        // Determine status
        const now = new Date();
        // Extract date and time parts
        const [year, month, day] = surv.date_exam.slice(0, 10).split('-');
        const [hour, minute, second] = surv.horaire.split(':');
        // Construct local datetime
        const examDateTime = new Date(
            Number(year), Number(month) - 1, Number(day) + 1,
            Number(hour), Number(minute), Number(second)
        );
        
        let status, statusClass;
        if (examDateTime >= now) {
        status = "À venir";
        statusClass = "status-badge confirmed"; // green
        } else {
        status = "Terminé";
        statusClass = "status-badge pending"; // red
        }
        
        row.innerHTML = `
            <td>${formatDate(surv.date_exam)}</td>
            <td>${formatTime(surv.horaire)}</td>
            <td>${surv.salle}</td>
            <td>${surv.module}</td>
            <td>${surv.specialite}</td>
            <td>${surv.section}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>
                    <button class="action-btn view" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const examId = this.closest('tr').getAttribute('data-exam-id');
                showExamDetails(examId);
            });
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

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function formatTime(timeString) {
    return timeString.substring(0, 5);
}
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

function formatResponsableName(surveillance) {
    // Split and format the code_enseignant
    const nameParts = surveillance.code_enseignant.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    
    // Join with spaces
    const fullName = nameParts.join(' ');
    let title = 'Prof. ';

    return `${title}${fullName}`.trim();
}


// Function to show exam details in modal
async function showExamDetails(examId) {

    try {
        // Fetch surveillances from your API endpoint
        const allSurveillances = await loadAllSurveillances();

        // Find the surveillance data
        const clickedSurveillance = allSurveillances.find(s => s.id == examId);
        if (!clickedSurveillance) return;
    
        // Find all surveillances for this exam (same date, time, module, and salle)
        const examGroup = allSurveillances.filter(s => 
            s.date_exam === clickedSurveillance.date_exam &&
            s.horaire === clickedSurveillance.horaire &&
            s.salle === clickedSurveillance.salle &&
            s.module === clickedSurveillance.module &&
            s.semestre === clickedSurveillance.semestre
        );
    
        // Separate principal and assistants
        const principal = examGroup.find(s => s.ordre === 1);
        const assistants = examGroup.filter(s => s.ordre > 1);
    
        // Format the time (08:00:00 → 08:00)
        const formattedTime = formatTime(clickedSurveillance.horaire);
        const formattedDate = formatDate(clickedSurveillance.date_exam);

    
        // Populate basic info
        document.getElementById('exam-date').textContent = formattedDate;
        document.getElementById('exam-time').textContent = formattedTime;
        document.getElementById('exam-room').textContent = clickedSurveillance.salle.toUpperCase();
        document.getElementById('exam-module').textContent = clickedSurveillance.module;
        document.getElementById('exam-department').textContent = clickedSurveillance.specialite;
        document.getElementById('exam-department').textContent = `${clickedSurveillance.specialite.toUpperCase()} - ${clickedSurveillance.section ? clickedSurveillance.section.toUpperCase() : ''}`;
        document.getElementById('exam-responsible').textContent = formatResponsableName(clickedSurveillance);
    
        // Optional fields with fallbacks
        document.getElementById('exam-students').textContent = 'Non spécifié';
        document.getElementById('exam-requirements').textContent = 'Aucune exigence spéciale';
    
        // Populate proctors list
        const proctorsList = document.getElementById('proctors-list');
        proctorsList.innerHTML = '';
    
        // Add principal proctor
        if (principal) {
            const principalCard = document.createElement('div');
            principalCard.className = 'proctor-card principal';
            principalCard.innerHTML = `
                <div class="proctor-avatar">${getInitials(principal.code_enseignant)}</div>
                <div>
                    <div class="proctor-name">${formatResponsableName(principal)}</div>
                    <div class="proctor-role">Surveillant Principal</div>
                </div>
            `;
            proctorsList.appendChild(principalCard);
        }
    
        // Add assistant proctors
        assistants.forEach(assistant => {
            const assistantCard = document.createElement('div');
            assistantCard.className = 'proctor-card assistant';
            assistantCard.innerHTML = `
                <div class="proctor-avatar">${getInitials(assistant.code_enseignant)}</div>
                <div>
                    <div class="proctor-name">${formatResponsableName(assistant)}</div>
                    <div class="proctor-role">Surveillant Assistant ${assistant.ordre > 2 ? assistant.ordre - 1 : ''}</div>
                </div>
            `;
            proctorsList.appendChild(assistantCard);
        });

        
        // Show modal
        document.getElementById('examModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading surveillances:', error);
    }
}

function closeModal() {
    document.getElementById('examModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Helper function to get initials from code_enseignant
function getInitials(code) {
    if (!code) return '';
    return code.split('_')
        .map(part => part.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
}

async function populateSurveillanceSelect() {
    const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
    if (!enseignant.code_enseignant) return;

    const surveillances = await loadAllSurveillances();
    const mySurveillances = surveillances.filter(
        s => s.code_enseignant === enseignant.code_enseignant
    );

    const select = document.getElementById('surveillanceSelect');
    if (!select) return;

    // Clear existing options except the first
    select.innerHTML = '<option value="">Sélectionnez une surveillance</option>';

    mySurveillances.forEach(surv => {
        const date = formatDate(surv.date_exam);
        const startTime = formatTime(surv.horaire);
        // Assuming each exam is 1.5h (90min)
        const [h, m] = startTime.split(':').map(Number);
        const end = new Date(0, 0, 0, h, m + 90);
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        const label = `${date} - ${surv.module} (${startTime}-${endTime}, ${surv.salle})`;
        const option = document.createElement('option');
        option.value = surv.id;
        option.textContent = label;
        select.appendChild(option);
    });
}

// Call this after DOMContentLoaded and after surveillances are loaded
document.addEventListener('DOMContentLoaded', function() {
    populateSurveillanceSelect();
    //populateColleagueSelect();
});
