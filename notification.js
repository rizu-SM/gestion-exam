// Add interactivity for notifications
        document.addEventListener('DOMContentLoaded', function() {
            // Mark as read/unread functionality
            document.querySelectorAll('.notification-mark-read').forEach(button => {
                button.addEventListener('click', function() {
                    const notification = this.closest('.notification-item');
                    notification.classList.toggle('unread');
                    
                    if (notification.classList.contains('unread')) {
                        this.textContent = 'Marquer comme lu';
                        // Add badge if not present
                        if (!notification.querySelector('.unread-badge')) {
                            notification.insertAdjacentHTML('beforeend', '<span class="unread-badge"></span>');
                        }
                    } else {
                        this.textContent = 'Marquer comme non lu';
                        // Remove badge
                        const badge = notification.querySelector('.unread-badge');
                        if (badge) badge.remove();
                    }
                });
            });

            // Filter functionality
            document.querySelectorAll('.notification-filter').forEach(filter => {
                filter.addEventListener('click', function() {
                    document.querySelectorAll('.notification-filter').forEach(f => f.classList.remove('active'));
                    this.classList.add('active');
                    
                    // In a real app, you would filter notifications here
                    // This is just for demonstration
                    console.log('Filter by:', this.textContent);
                });
            });
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
});




// --- Gestion des demandes ---
document.addEventListener('DOMContentLoaded', function() {
    const notificationList = document.getElementById('notificationList');
    const emptyNotifications = document.getElementById('emptyNotifications');
    let allRequests = [];

    // Exemple de récupération (remplacez par votre API réelle)
    async function fetchRequests() {
        // Remplacer par votre endpoint réel
        const res = await fetch('http://localhost:3000/getdemandes?status=pending');
        return res.ok ? await res.json() : [];
    }

    function formatType(type) {
        if (type === 'change') return '<span class="request-type-badge change">Changement de créneau</span>';
        if (type === 'swap') return '<span class="request-type-badge swap">Avec un collègue</span>';
        if (type === 'cancel') return '<span class="request-type-badge cancel">Annulation</span>';
        return '';
    }


let currentPage = 1;
const pageSize = 8;

function renderRequests(typeFilter = '') {
    notificationList.innerHTML = '';
    let filtered = typeFilter ? allRequests.filter(r => r.type === typeFilter) : allRequests;
    const totalPages = Math.ceil(filtered.length / pageSize);

    if (filtered.length === 0) {
        emptyNotifications.style.display = '';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    emptyNotifications.style.display = 'none';

    // Découpe la page
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    // Affiche les notifications de la page courante
    pageItems.forEach(req => {
        const iconClass = req.type === 'cancel' ? 'alert' : req.type === 'swap' ? 'info' : 'warning';
        const icon = req.type === 'cancel' ? 'fa-exclamation' : req.type === 'swap' ? 'fa-user-friends' : 'fa-clock';
        notificationList.innerHTML += `
            <div class="notification-item unread" data-id="${req.id}" style="cursor:pointer;">
                <div class="notification-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">
                        <span>${formatType(req.type)}</span>
                        <span class="notification-time">${formatDate(req.date_demande)}</span>
                    </div>
                    <p class="notification-message">${req.motif}</p>
                </div>
                <span class="unread-badge"></span>
            </div>
        `;
    });

    // Pagination
    let pagHtml = '';
    if (totalPages > 1) {
        pagHtml += `<button ${currentPage === 1 ? 'disabled' : ''} id="prevPage">Précédent</button>`;
        for (let i = 1; i <= totalPages; i++) {
            pagHtml += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
        }
        pagHtml += `<button ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">Suivant</button>`;
    }
    document.getElementById('pagination').innerHTML = pagHtml;

    // Listeners pagination
    if (document.getElementById('prevPage')) {
        document.getElementById('prevPage').onclick = () => { if(currentPage > 1){ currentPage--; renderRequests(typeFilter); } };
    }
    if (document.getElementById('nextPage')) {
        document.getElementById('nextPage').onclick = () => { if(currentPage < totalPages){ currentPage++; renderRequests(typeFilter); } };
    }
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = function() {
            currentPage = Number(this.dataset.page);
            renderRequests(typeFilter);
        };
    });
}



function openModal(request) {
    

    function formatSurv(surv, id) {
        if (!surv) return `<span style="color:#aaa;">Aucune</span>`;

        // Format the date
        const date = new Date(surv.date_exam);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

        // Format the time range
        const [hour, minute] = surv.horaire.split(':').map(Number);
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const endTime = new Date(0, 0, 0, hour, minute + 90); // Assuming 90 minutes duration
        const formattedEndTime = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

        // Combine the formatted details without the colon
        return `
        ${formattedDate} - ${surv.code_module ? surv.code_module : ''} ${surv.module ? surv.module : ''} 
        (${startTime}-${formattedEndTime}${surv.salle ? ', ' + surv.salle : ''})`;
    }

    console.log(request);

    let html = `
        <div class="exam-section">
            <h3 class="section-title">
                <i class="fas fa-info-circle"></i>
                Informations de la demande
            </h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Demandeur</div>
                    <div class="detail-value">${formatResponsableName(request)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date de la demande</div>
                    <div class="detail-value">${formatDate(request.date_demande)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Motif</div>
                    <div class="detail-value" id="motifValue">${request.motif}</div>
                </div>
            </div>
        </div>
        <div class="exam-section">
            <h3 class="section-title">
                <i class="fas fa-clipboard-list"></i>
                Surveillance concernée
            </h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Surveillance</div>
                    <div class="detail-value">${formatSurv(request.surveillance, request.surveillance_id)}</div>
                </div>
            </div>
        </div>
    `;

    if (request.type === 'change') {
        html += `
        <div class="exam-section">
            <h3 class="section-title">
                <i class="fas fa-calendar-alt"></i>
                Changement de créneau
            </h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Date préférée</div>
                    <div class="detail-value">${request.preferred_date ? formatDate(request.preferred_date) : '<span style="color:#aaa;">Non spécifiée</span>'}</div>
                </div>
            </div>
        </div>
        `;
    }

    if (request.type === 'swap') {
        html += `
        <div class="exam-section">
            <h3 class="section-title">
                <i class="fas fa-user-friends"></i>
                Échange avec un collègue
            </h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Collègue</div>
                    <div class="detail-value">${formatColleaguesName(request) || '<span style="color:#aaa;">Non spécifié</span>'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Surveillance préférée</div>
                    <div class="detail-value">
                        ${request.preferred_surveillance
                        ? formatSurv(request.preferred_surveillance, request.preferred_surveillance_id)
                        : (request.preferred_date ? formatDate(request.preferred_date) : '<span style="color:#aaa;">Non spécifiée</span>')}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    document.getElementById('modalDetails').innerHTML = html;
    document.getElementById('modalTitle').innerHTML = formatType(request.type);
    document.getElementById('modalMotif').value = '';
    document.getElementById('requestModal').style.display = 'flex';

    // Actions
    document.getElementById('acceptBtn').onclick = async function() {
        await handleAction(request.id, 'accepted', '');
    };
    document.getElementById('rejectBtn').onclick = async function() {
        const motif = document.getElementById('modalMotif').value.trim();
        if (!motif) {
            alert('Veuillez saisir un motif pour le rejet.');
            return;
        }
        await handleAction(request.id, 'declined', motif);

        // Mettre à jour le motif dans l'interface après rejet
        document.getElementById('motifValue').innerText = motif;
        request.motif = motif; // Mettre à jour localement
    };

    // Fermer le modal
    document.getElementById('closeModal').onclick = function() {
        document.getElementById('requestModal').style.display = 'none';
    };
}


//........................................................................................
    // Fermer le modal
    document.getElementById('closeModal').onclick = function() {
        document.getElementById('requestModal').style.display = 'none';
    };

    // Action accepter/rejeter
    async function handleAction(id, status, motif) {
        // Remplacer par votre endpoint réel
        await fetch(`http://localhost:3000/demandeslist/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status, motif_rejet: motif})
            
        });
        document.getElementById('requestModal').style.display = 'none';
        // Rafraîchir la liste
        allRequests = allRequests.filter(r => r.id !== id);
        renderRequests(document.querySelector('.notification-filter.active').dataset.type);
    }

    // Clic sur une demande pour voir les détails
    notificationList.onclick = function(e) {
        const item = e.target.closest('.notification-item');
        if (!item) return;
        const req = allRequests.find(r => r.id == item.dataset.id);
        if (req) openModal(req);
    };

    // Filtres
    document.querySelectorAll('.notification-filter').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.notification-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderRequests(this.dataset.type);
        };
    });

    // Initialisation
    (async function() {
        allRequests = await fetchRequests();
        renderRequests();
    })();
});

// Quand tu changes de filtre, remets currentPage à 1 :
document.querySelectorAll('.notification-filter').forEach(btn => {
    btn.onclick = function() {
        document.querySelectorAll('.notification-filter').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentPage = 1;
        renderRequests(this.dataset.type);
    };
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

function formatResponsableName(request) {
    // Split and format the code_enseignant
    const nameParts = request.code_enseignant.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    
    // Join with spaces
    const fullName = nameParts.join(' ');
    let title = 'Prof. ';

    return `${title}${fullName}`.trim();
}

function formatColleaguesName(request) {
    // Split and format the code_enseignant
    const nameParts = request.colleague_code.split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    
    // Join with spaces
    const fullName = nameParts.join(' ');
    let title = 'Prof. ';

    return `${title}${fullName}`.trim();
}



function formatType(request) {
    const date = formatDate(request.date_exam);
        const startTime = formatTime(request.horaire);
        // Assuming each exam is 1.5h (90min)
        const [h, m] = startTime.split(':').map(Number);
        const end = new Date(0, 0, 0, h, m + 90);
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        const label = `${date} - ${request.module} (${startTime}-${endTime}, ${request.salle})`;
        return label;
}