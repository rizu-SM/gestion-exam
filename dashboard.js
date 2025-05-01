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
    loadAndDisplayUpcomingSurveillances();

    // Load statistics when page loads
    loadStatistics();

    // Refresh every 5 minutes
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
async function loadStatistics() {
    try {
        // 1. Load Examens Programmés
        const examsResponse = await fetch('http://localhost:3000/exam-stats');
        
        if (!examsResponse.ok) {
            throw new Error(`HTTP error! status: ${examsResponse.status}`);
        }
        
        const examsData = await examsResponse.json();
        
        if (!examsData.success) {
            throw new Error(examsData.error || 'Failed to load exam data');
        }
        
        updateCard(
            '.stat-card:nth-child(1)',
            examsData.total,
            examsData.weeklyChange,
            'semaine dernière'
        );

        // 2. Load Surveillances Assignées
        const surveillanceResponse = await fetch('http://localhost:3000/surveillance-stats');
        
        if (!surveillanceResponse.ok) {
            throw new Error(`HTTP error! status: ${surveillanceResponse.status}`);
        }
        
        const surveillanceData = await surveillanceResponse.json();
        
        if (!surveillanceData.success) {
            throw new Error(surveillanceData.error || 'Failed to load surveillance data');
        }
        
        updateCard(
            '.stat-card:nth-child(2)',
            surveillanceData.total,
            surveillanceData.dailyChange,
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



//loadAndDisplayUpcomingSurveillances
async function loadUpcomingSurveillances() {
    try {
        const response = await fetch('http://localhost:3000/surveillance'); // Remplacez par l'URL correcte
        if (!response.ok) {
            throw new Error('Erreur de récupération des données');
        }
        return await response.json();  // Récupère les données au format JSON
    } catch (error) {
        console.error('Error loadUpcomingSurveillances:', error);
        throw error; // Lance une erreur si la récupération échoue
    }
}

async function loadAndDisplayUpcomingSurveillances() {
    try {
        // Fetch surveillances from your API endpoint
        const surveillances = await loadUpcomingSurveillances();
        console.log("surveillances", surveillances);
        
        
        // Get the table body element
        const tbody = document.querySelector('#surveillancesBody');
        tbody.innerHTML = ''; // Clear existing rows
        
        // 1. Filter upcoming surveillances with ordre = 1
        // 2. Sort by date (nearest first)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day

        const upcomingSurveillances = surveillances.filter(surveillance => {
            const examDate = new Date(surveillance.date_exam);
            return examDate >= today && surveillance.ordre === 1;
        })
        // .sort((a, b) => {
        //     const dateA = new Date(a.date_exam + 'T' + a.horaire);
        //     const dateB = new Date(b.date_exam + 'T' + b.horaire);
        //     return dateA - dateB; // Sort ascending (earliest first)
        // });


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
        document.getElementById('exam-room').textContent = clickedSurveillance.salle;
        document.getElementById('exam-module').textContent = clickedSurveillance.module;
        document.getElementById('exam-department').textContent = clickedSurveillance.specialite;
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