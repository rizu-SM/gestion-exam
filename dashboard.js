document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // Ici vous pourriez charger les données de la session sélectionnée
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Set active menu item
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    //loadAndDisplayUpcomingSurveillances
    // loadAndDisplayUpcomingSurveillances();
    loadUpcomingSurveillances();

    // Load statistics when page loads
    loadStatistics();

    // // Refresh every 5 minutes
    setInterval(loadStatistics, 300000);

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
});


// // Function to load and display statistics
// async function loadStatistics() {
//     try {
//         // 1. Load Examens Programmés
//         const examsResponse = await fetch('http://localhost:3000/Examens-Programmes');
        
//         if (!examsResponse.ok) {
//             throw new Error(`HTTP error! status: ${examsResponse.status}`);
//         }
        
//         const examsData = await examsResponse.json();
        
//         if (!examsData.success) {
//             throw new Error(examsData.error || 'Failed to load exam data');
//         }
        
//         updateCard(
//             '.stat-card:nth-child(1)',
//             examsData.total,
//             examsData.weeklyChange,
//             'semaine dernière'
//         );

//         // 2. Load Surveillances Assignées
//         const surveillanceResponse = await fetch('http://localhost:3000//Surveillances-Assignees');
        
//         if (!surveillanceResponse.ok) {
//             throw new Error(`HTTP error! status: ${surveillanceResponse.status}`);
//         }
        
//         const surveillanceData = await surveillanceResponse.json();
        
//         if (!surveillanceData.success) {
//             throw new Error(surveillanceData.error || 'Failed to load surveillance data');
//         }
        
//         updateCard(
//             '.stat-card:nth-child(2)',
//             surveillanceData.total,
//             surveillanceData.dailyChange,
//             'hier'
//         );

//     } catch (error) {
//         console.error('Error loading statistics:', error);
//         showErrorState();
//     }
// }

// Function to load and display statistics for the selected session
async function loadStatistics() {
    try {
        // 1. Détermination automatique de l'année universitaire (même logique que le backend)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        let annee_universitaire;
        if (currentMonth >= 9) {
            annee_universitaire = `${currentYear}-${currentYear + 1}`;
        } else {
            annee_universitaire = `${currentYear - 1}-${currentYear}`;
        }

        // 2. Récupérer le semestre sélectionné
        const activeSessionBtn = document.querySelector('.session-btn.active');
        const selectedSemestre = activeSessionBtn ? activeSessionBtn.dataset.semestre : null;

        // 3. Fetch stats
        const examsResponse = await fetch('http://localhost:3000/Examens-Programmes');
        if (!examsResponse.ok) throw new Error(`HTTP error! status: ${examsResponse.status}`);
        const examsData = await examsResponse.json();
        if (!examsData.success) throw new Error(examsData.error || 'Failed to load exam data');

        const surveillanceResponse = await fetch('http://localhost:3000/Surveillances-Assignees');
        if (!surveillanceResponse.ok) throw new Error(`HTTP error! status: ${surveillanceResponse.status}`);
        const surveillanceData = await surveillanceResponse.json();
        if (!surveillanceData.success) throw new Error(surveillanceData.error || 'Failed to load surveillance data');

        // 4. Filtrer par semestre ET année universitaire
        const examStat = examsData.data.find(stat =>
            stat.semestre === selectedSemestre &&
            stat.annee_universitaire === annee_universitaire
        ) || { total: 0, weeklyChange: 0 };

        const surveillanceStat = surveillanceData.data.find(stat =>
            stat.semestre === selectedSemestre &&
            stat.annee_universitaire === annee_universitaire
        ) || { total: 0, dailyChange: 0 };

        updateCard(
            '.stat-card:nth-child(1)',
            examStat.total,
            examStat.weeklyChange,
            'semaine dernière'
        );
        updateCard(
            '.stat-card:nth-child(2)',
            surveillanceStat.total,
            surveillanceStat.dailyChange,
            'hier'
        );
    } catch (error) {
        console.error('Error loading statistics:', error);
        showErrorState();
    }
}

// Helper function to update card UI
function updateCard(selector, total, change, timePeriod) {
    const card = document.querySelector(selector);
    if (!card) return;
    
    card.querySelector('.stat-value').textContent = total || '0';
    
    const changeElement = card.querySelector('.stat-change');
    if (change > 0) {
        changeElement.textContent = `+${change} depuis ${timePeriod}`;
        changeElement.style.color = '#28a745'; // Green for positive
    } else if (change < 0) {
        changeElement.textContent = `${change} depuis ${timePeriod}`;
        changeElement.style.color = '#dc3545'; // Red for negative
    } else {
        changeElement.textContent = `Aucun changement`;
        changeElement.style.color = '#6c757d'; // Gray for neutral
    }
}

// Show error state
function showErrorState() {
    document.querySelectorAll('.stat-card').forEach(card => {
        card.querySelector('.stat-value').textContent = '--';
        const changeElement = card.querySelector('.stat-change');
        changeElement.textContent = 'Données indisponibles';
        changeElement.style.color = '#dc3545'; // Red for error
    });
}

// Rafraîchir les stats quand on change de session
document.querySelectorAll('.session-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const session = this.dataset.semestre;
        filterExamsBySession(session);
        loadStatistics(); // <-- Ajout : recharge les stats pour la session sélectionnée
    });
});



//loadAndDisplayUpcomingSurveillances
async function loadUpcomingSurveillances() {
    try {
        const response = await fetch('http://localhost:3000/surveillance'); // Remplacez par l'URL correcte
        if (!response.ok) {
            throw new Error('Erreur de récupération des données');
        }
        allSurveillances = await response.json();  // Récupère les données au format JSON
        // Get the active session
        const activeSessionBtn = document.querySelector('.session-btn.active');
        if (activeSessionBtn) {
            const activeSession = activeSessionBtn.dataset.semestre;
            filterExamsBySession(activeSession); // Filter exams by the active session
        } else {
            loadAndDisplayUpcomingSurveillances(allSurveillances); // Display all exams if no session is selected
        }
        return await allSurveillances;  // Récupère les données au format JSON
    } catch (error) {
        console.error('Error loadUpcomingSurveillances:', error);
        throw error; // Lance une erreur si la récupération échoue
    }
}

// Filter exams by session
function filterExamsBySession(session) {
    const filteredSurveillances = allSurveillances.filter(exam => exam.semestre === session);

    // Now filter by date_exam and horaire (upcoming only)
    // const now = new Date();
    // const upcomingSurveillances = filteredSurveillances.filter(surveillance => {
    //     if (!surveillance.date_exam || !surveillance.horaire) return false;
    //     // Combine date_exam and horaire
    //     const examDateTime = new Date(`${surveillance.date_exam}T${surveillance.horaire}`);
    //     return examDateTime >= now && surveillance.ordre === 1;
    // });

    loadAndDisplayUpcomingSurveillances(filteredSurveillances);
}

async function loadAndDisplayUpcomingSurveillances(surveillances) {
    try {
        // Fetch surveillances from your API endpoint
        // const surveillances = await loadUpcomingSurveillances();
        console.log("surveillances", surveillances);
        
        
        // Get the table body element
        const tbody = document.querySelector('#surveillancesBody');
        tbody.innerHTML = ''; // Clear existing rows
        
        // 1. Filter upcoming surveillances with ordre = 1
        // 2. Sort by date (nearest first)
        // const today = new Date();
        // today.setHours(0, 0, 0, 0); // Set to beginning of day

        // const upcomingSurveillances = surveillances.filter(surveillance => {
        //     const examDate = new Date(surveillance.date_exam);
        //     return examDate >= today && surveillance.ordre === 1;
        // })

        const now = new Date();

        const upcomingSurveillances = surveillances.filter(surveillance => {
            if (!surveillance.date_exam || !surveillance.horaire) return false;
            // Extract date and time parts
            const [year, month, day] = surveillance.date_exam.slice(0, 10).split('-');
            const [hour, minute, second] = surveillance.horaire.split(':');
            // Construct local datetime
            const examDateTime = new Date(
                Number(year), Number(month) - 1, Number(day) + 1,
                Number(hour), Number(minute), Number(second)
            );
            // Debug
            return examDateTime >= now && surveillance.ordre === 1;
        })


        console.log("upcomingSurveillances", upcomingSurveillances);


        if (upcomingSurveillances.length === 0) {
            const tbody = document.querySelector('#surveillancesBody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">
                        Pas de Surveillances a Venir.
                    </td>
                </tr>
            `;
        }
        
        // Add each upcoming surveillance to the table
        upcomingSurveillances.forEach(surveillance => {
            const row = document.createElement('tr');
            row.setAttribute('data-exam-id', surveillance.id);

            // Format the date as DD/MM/YYYY
            const formattedDate = formatDate(surveillance.date_exam);
            // Format time (08:00:00 → 08:00)
            const formattedTime = formatTime(surveillance.horaire);

            // Store all surveillance data as data attributes
            row.setAttribute('data-date-exam', formattedDate);
            row.setAttribute('data-horaire', formattedTime);
            row.setAttribute('data-salle', surveillance.salle);
            row.setAttribute('data-module', surveillance.module);
            row.setAttribute('data-specialite', surveillance.specialite);
            row.setAttribute('data-responsable', formatResponsableName(surveillance));
            
            // Create table cells
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${surveillance.salle}</td>
                <td>${surveillance.module}</td>
                <td>${surveillance.specialite}</td>
                <td>${formatResponsableName(surveillance)}</td>
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
        
    } catch (error) {
        console.error('Error loading surveillances:', error);
        // You might want to show an error message to the user
        const tbody = document.querySelector('#surveillancesBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--danger);">
                    Erreur de chargement des données. Veuillez rafraîchir la page.
                </td>
            </tr>
        `;
    }
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
        const allSurveillances = await loadUpcomingSurveillances();

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