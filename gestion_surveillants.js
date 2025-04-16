// Simple modal toggle functionality
const addProctorBtn = document.getElementById('addProctorBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const modal = document.getElementById('addProctorModal');

addProctorBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelAddBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});