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



document.addEventListener('DOMContentLoaded', async function() {
    const enseignant = JSON.parse(localStorage.getItem('enseignant') || '{}');
    const tbody = document.getElementById('requestsBody');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');

    // Fetch requests for the logged-in enseignant
    async function fetchRequests() {
        // Replace with your real API endpoint
        const res = await fetch(`http://localhost:3000/demandes?code_enseignant=${encodeURIComponent(enseignant.code_enseignant)}`);
        return res.ok ? await res.json() : [];
    }

    function formatType(type) {
        switch(type) {
            case 'change': return '<span class="request-type-badge change">Changement de créneau</span>';
            case 'swap': return '<span class="request-type-badge swap">Échange avec un collègue</span>';
            case 'cancel': return '<span class="request-type-badge cancel">Annulation</span>';
            default: return '';
        }
    }
    function formatStatus(status) {
        if (status === 'pending') return '<span class="request-status-badge pending">En attente</span>';
        if (status === 'accepted') return '<span class="request-status-badge accepted">Acceptée</span>';
        if (status === 'declined') return '<span class="request-status-badge rejected">Rejetée</span>';
        return '';
    }
    function formatSurveillance(s) {
        // Example: "15/05/2023 - Algorithmes (09:00-10:30, B12)"
        const date = formatDate(s.date_exam);
        const start = s.horaire.substring(0,5);
        const [h, m] = start.split(':').map(Number);
        const end = new Date(0,0,0,h,m+90);
        const endTime = `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
        return `${date} - ${s.module} (${start}-${endTime}, ${s.salle})`;
    }
    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
    }

    let allRequests = [];
    async function renderRequests() {
        tbody.innerHTML = '<tr><td colspan="5">Chargement...</td></tr>';
        allRequests = await fetchRequests();
        displayRequests();
    }
    function displayRequests() {
        let filtered = allRequests;
        if (filterType.value) filtered = filtered.filter(r => r.type === filterType.value);
        if (filterStatus.value) filtered = filtered.filter(r => r.status === filterStatus.value);

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucune demande trouvée.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        filtered.forEach(req => {
            tbody.innerHTML += `
                <tr>
                    <td>${formatDate(req.date_demande)}</td>
                    <td>${formatSurveillance(req.surveillance)}</td>
                    <td>${formatType(req.type)}</td>
                    <td>${req.motif}</td>
                    <td>${formatStatus(req.status)}</td>
                </tr>
            `;
        });
    }

    filterType.addEventListener('change', displayRequests);
    filterStatus.addEventListener('change', displayRequests);

    renderRequests();
});