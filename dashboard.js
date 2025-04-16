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

    // View buttons - Exam Details Modal
    const viewButtons = document.querySelectorAll('.action-btn.view');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const examId = this.closest('tr').getAttribute('data-exam-id');
            showExamDetails(examId);
        });
    });

    // Modal controls
    const examModal = document.getElementById('examModal');
    const closeBtn = document.getElementById('closeModalBtn');
    
    closeBtn.addEventListener('click', closeModal);
    examModal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Edit button in modal
    document.getElementById('editExamBtn').addEventListener('click', function() {
        const examId = document.getElementById('examModal').getAttribute('data-exam-id');
        editExam(examId);
    });

    // Print button
    document.getElementById('printBtn').addEventListener('click', function() {
        window.print();
    });
});

// Current exam being viewed/edited
let currentExamId = null;

// Function to show exam details
function showExamDetails(examId) {
    currentExamId = examId;
    document.getElementById('examModal').setAttribute('data-exam-id', examId);
    
    // In a real app, you would fetch this data from your API
    const examData = getExamData(examId);
    
    // Populate modal
    document.getElementById('exam-date').textContent = examData.date;
    document.getElementById('exam-time').textContent = examData.time;
    document.getElementById('exam-room').textContent = examData.room;
    document.getElementById('exam-module').textContent = examData.module;
    document.getElementById('exam-department').textContent = examData.department;
    document.getElementById('exam-responsible').textContent = examData.responsible;
    document.getElementById('exam-students').textContent = examData.students;
    document.getElementById('exam-requirements').textContent = examData.requirements;
    
    // Populate proctors
    const proctorsList = document.getElementById('proctors-list');
    proctorsList.innerHTML = examData.proctors.map(proctor => `
        <div class="proctor-card">
            <div class="proctor-avatar">${proctor.initials}</div>
            <div>
                <div class="proctor-name">${proctor.name}</div>
                <div class="proctor-role">${proctor.role}</div>
            </div>
        </div>
    `).join('');
    
    // Show modal
    document.getElementById('examModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Function to edit exam
function editExam(examId) {
    alert(`Modification de l'examen avec ID: ${examId}\n\nDans une application réelle, cela ouvrirait un formulaire de modification.`);
    // In a real app, you would:
    // 1. Open an edit form/modal
    // 2. Pre-fill with exam data
    // 3. Handle form submission
}

function closeModal() {
    document.getElementById('examModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Example data - replace with real API calls
function getExamData(examId) {
    const exams = {
        '1': {
            id: '1',
            date: '05/05/2025',
            time: '13:00 - 15:00',
            room: 'C6',
            module: 'Algorithmes',
            department: 'Informatique',
            responsible: 'Prof. Lahrech',
            students: 48,
            requirements: 'Projecteur nécessaire',
            proctors: [
                { name: 'Prof. Mohamed Lahrech', role: 'Surveillant Principal', initials: 'ML' },
                { name: 'Dr. Amina Saidi', role: 'Surveillant Assistant', initials: 'AS' }
            ]
        },
        '2': {
            id: '2',
            date: '05/05/2025',
            time: '09:00 - 11:00',
            room: 'B12',
            module: 'Systèmes de Bases de Données',
            department: 'Informatique',
            responsible: 'Dr. Smith',
            students: 42,
            requirements: 'Aucune exigence spéciale',
            proctors: [
                { name: 'Dr. Smith', role: 'Surveillant Principal', initials: 'DS' }
            ]
        },
        '3': {
            id: '3',
            date: '06/05/2025',
            time: '10:00 - 12:00',
            room: 'A8',
            module: 'Calcul II',
            department: 'Mathématiques',
            responsible: 'Prof. Johnson',
            students: 35,
            requirements: 'Calculatrices scientifiques autorisées',
            proctors: [
                { name: 'Prof. Johnson', role: 'Surveillant Principal', initials: 'PJ' },
                { name: 'Dr. Williams', role: 'Assistant', initials: 'DW' }
            ]
        },
        '4': {
            id: '4',
            date: '07/05/2025',
            time: '14:00 - 16:00',
            room: 'D3',
            module: 'Physique I',
            department: 'Physique',
            responsible: 'Dr. Williams',
            students: 28,
            requirements: 'Fiches de formules fournies',
            proctors: [
                { name: 'Dr. Williams', role: 'Surveillant Principal', initials: 'DW' }
            ]
        }
    };
    
    return exams[examId] || exams['1']; // Default to first exam if not found
}






































// document.addEventListener('DOMContentLoaded', function() {
//     const currentPage = window.location.pathname.split('/').pop();
//     const menuItems = document.querySelectorAll('.menu-item');
    
//     menuItems.forEach(item => {
//         const itemHref = item.getAttribute('href');
//         if (itemHref === currentPage) {
//             item.classList.add('active');
//         } else {
//             item.classList.remove('active');
//         }
//     });
// });


// document.addEventListener('DOMContentLoaded', function() {
//     // Column visibility toggle
//     const columnsBtn = document.getElementById('columnsBtn');
//     const columnCheckboxes = document.querySelectorAll('.columns-dropdown input');
    
//     columnCheckboxes.forEach(checkbox => {
//         checkbox.addEventListener('change', function() {
//             const columnName = this.name.replace('col-', '');
//             const columnCells = document.querySelectorAll(`[data-column="${columnName}"]`);
//             const isVisible = this.checked;
            
//             // Show/hide column cells
//             columnCells.forEach(cell => {
//                 cell.style.display = isVisible ? '' : 'none';
//             });
            
//             // Show/hide header
//             const header = document.querySelector(`th[data-column="${columnName}"]`);
//             if (header) {
//                 header.style.display = isVisible ? '' : 'none';
//             }
//         });
//     });
    
//     // Sortable table
//     const table = document.getElementById('proctoringTable');
//     const headers = table.querySelectorAll('th');
    
//     headers.forEach(header => {
//         header.addEventListener('click', function() {
//             const columnIndex = this.cellIndex;
//             const isAscending = this.classList.contains('asc');
//             const sortDirection = isAscending ? 'desc' : 'asc';
            
//             // Reset all headers
//             headers.forEach(h => {
//                 h.classList.remove('asc', 'desc');
//             });
            
//             // Set current header
//             this.classList.add(sortDirection);
            
//             // Sort table
//             sortTable(columnIndex, sortDirection);
//         });
//     });
    
//     function sortTable(columnIndex, direction) {
//         const tbody = table.querySelector('tbody');
//         const rows = Array.from(tbody.querySelectorAll('tr'));
        
//         rows.sort((a, b) => {
//             const aValue = a.cells[columnIndex].textContent.trim();
//             const bValue = b.cells[columnIndex].textContent.trim();
            
//             if (direction === 'asc') {
//                 return aValue.localeCompare(bValue);
//             } else {
//                 return bValue.localeCompare(aValue);
//             }
//         });
        
//         // Reattach sorted rows
//         rows.forEach(row => tbody.appendChild(row));
//     }
    
//     // Pagination controls
//     const rowsPerPage = document.getElementById('rowsPerPage');
//     rowsPerPage.addEventListener('change', function() {
//         // Implement pagination logic here
//         console.log('Rows per page changed to:', this.value);
//     });
    
//     // Refresh button
//     document.getElementById('refreshTable').addEventListener('click', function() {
//         // Implement refresh logic here
//         console.log('Table refresh requested');
//         // You would typically fetch new data from your backend here
//     });
// });


// // Refresh button functionality
// const refreshBtn = document.querySelector('.refresh-btn');
// refreshBtn.addEventListener('click', function() {
//     // Add rotating animation
//     this.classList.add('rotating');
    
//     // Simulate data refresh (replace with actual API call)
//     setTimeout(() => {
//         this.classList.remove('rotating');
//         alert('Data refreshed successfully!');
//         // Here you would typically:
//         // 1. Fetch new data from your API
//         // 2. Update the table content
//     }, 1000);
// });

// // Column visibility toggle
// const columnCheckboxes = document.querySelectorAll('.columns-dropdown input');
// columnCheckboxes.forEach(checkbox => {
//     checkbox.addEventListener('change', function() {
//         const columnName = this.nextSibling.textContent.trim();
//         console.log(`Toggled ${columnName} column visibility`);
//         // Here you would:
//         // 1. Show/hide the corresponding column
//         // 2. Save preference to localStorage if desired
//     });
// });

// // Rows per page selector
// const rowsSelect = document.querySelector('.rows-select');
// rowsSelect.addEventListener('change', function() {
//     console.log(`Rows per page changed to: ${this.value}`);
//     // Here you would:
//     // 1. Update the table pagination
//     // 2. Possibly fetch new data from server with pagination parameters
// });

// document.querySelectorAll('.view-btn').forEach(btn => {
//     btn.addEventListener('click', function() {
//         const examId = this.getAttribute('data-exam-id');
//         showExamDetails(examId);
//     });
// });







// function showExamDetails(examId) {
//   // 1. Create a container div for the popup
//   const popupContainer = document.createElement('div');
//   popupContainer.id = 'popup-container';
//   document.body.appendChild(popupContainer);
  
//   // 2. Load the popup HTML
//   fetch('exam-popup.html')
//       .then(response => response.text())
//       .then(html => {
//           popupContainer.innerHTML = html;
          
//           // 3. Fetch your exam data
//           fetch(`/api/exams/${examId}`)
//               .then(response => response.json())
//               .then(data => {
//                   // 4. Call the popup's show function
//                   window.showExamModal(data);
//               });
//       });
// }

// // 5. Add click handlers to your View buttons
// document.querySelectorAll('.view-btn').forEach(btn => {
//   btn.addEventListener('click', function() {
//       const examId = this.dataset.examId;
//       showExamDetails(examId);
//   });
// });

// function closeExamPopup() {
//   const popupContainer = document.getElementById('popup-container');
//   if (popupContainer) {
//       // Trigger the popup's close animation
//       const modal = popupContainer.querySelector('.modal-overlay');
//       if (modal) modal.style.display = 'none';
      
//       // Remove after animation would complete
//       setTimeout(() => {
//           document.body.removeChild(popupContainer);
//       }, 300);
//   }
// }