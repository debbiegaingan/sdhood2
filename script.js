const firebaseConfig = {
    apiKey: "AIzaSyCpKlAIDom-xGfovoq_5c1HFFJQ2EzrPw",
    authDomain: "jamesshop.firebaseapp.com",
    databaseURL: "https://jamesshop-default-rtdb.firebaseio.com",
    projectId: "jamesshop",
    storageBucket: "jamesshop.firebasestorage.app",
    messagingSenderId: "872242106405",
    appId: "1:872242106405:web:018d3e44152e7e6319efcc",
    measurementId: "G-C8J9KLZHRW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let accounts = [];
let tempFeatures = [];
let tempImages = [];
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let isLoggedIn = false;
let currentStatusFilter = 'all-status'; // 'all-status', 'available', 'sold'
let currentCategoryFilter = 'all-category'; // 'all-category', 'account', 'items', 'robux'
const DEFAULT_PASSWORD = 'James0917928033!';

// Music player
let currentAudio = null;

function playMusic() {
    const musicSelect = document.getElementById('musicSelect');
    const musicFile = musicSelect.value;
    
    if (currentAudio) {
        currentAudio.pause();
    }
    
    currentAudio = new Audio(musicFile);
    currentAudio.volume = document.getElementById('volumeControl').value;
    currentAudio.loop = true;
    currentAudio.play().catch(err => {
        console.log('Autoplay blocked by browser:', err);
        alert('Click "Play Music" to start the music!');
    });
}

function pauseMusic() {
    if (currentAudio) {
        currentAudio.pause();
    }
}

function setVolume(volume) {
    if (currentAudio) {
        currentAudio.volume = volume;
    }
}

// Load accounts from Firebase and set up realtime listener
function loadAccounts() {
    console.log("Loading accounts from Firebase...");
    database.ref('accounts').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("Firebase data received:", data);
        if (data) {
            accounts = Object.values(data).map(account => {
                // Ensure all required fields exist with defaults
                return {
                    ...account,
                    status: account.status || 'AVAILABLE',
                    category: account.category || 'account',
                    price: Number(account.price), // Make sure price is a number
                    features: account.features || [],
                    images: account.images || []
                };
            }).sort((a, b) => b.createdAt - a.createdAt); // Newest first
        } else {
            accounts = [];
        }
        console.log("Accounts loaded:", accounts);
        renderAccounts();
    });
}

function saveAccounts() {
    // Convert accounts array to an object for Firebase
    const accountsObj = {};
    accounts.forEach(account => {
        accountsObj[account.id] = account;
    });
    database.ref('accounts').set(accountsObj);
}

function getPassword() {
    return localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
}

function setPassword(newPassword) {
    localStorage.setItem('adminPassword', newPassword);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderAccounts() {
    const grid = document.getElementById('accountsGrid');
    grid.innerHTML = '';
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    // Filter accounts based on current filters
    const filteredAccounts = accounts.filter(account => {
        const status = account.status || 'AVAILABLE';
        const category = account.category || 'account';
        
        // Check status filter
        let statusMatch = true;
        if (currentStatusFilter === 'available') {
            statusMatch = status === 'AVAILABLE';
        } else if (currentStatusFilter === 'sold') {
            statusMatch = status === 'SOLD';
        }
        
        // Check category filter
        let categoryMatch = true;
        if (currentCategoryFilter !== 'all-category') {
            categoryMatch = category === currentCategoryFilter;
        }
        
        return statusMatch && categoryMatch;
    });

    filteredAccounts.forEach((account) => {
        const card = document.createElement('div');
        card.className = 'account-card';
        // Ensure status is set (default to AVAILABLE if not present)
        const status = account.status || 'AVAILABLE';
        const category = account.category || 'account';
        
        const featuresHTML = account.features.map(feature => 
            `<span class="feature-tag">${feature}</span>`
        ).join('');

        const images = account.images || [];
        const mainImage = images[0] || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%2323272a%22 width=%22300%22 height=%22200%22/%3E%3Ctext fill=%22%235865f2%22 font-family=%22sans-serif%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ERoblox Account%3C/text%3E%3C/svg%3E';
        
        let galleryHTML = '';
        if (images.length > 0) {
            galleryHTML = `
                <div class="gallery-main" data-account-id="${account.id}">
                    <img src="${mainImage}" alt="${account.title}" class="account-image clickable">
                    ${images.length > 1 ? `<div class="image-count">+${images.length - 1}</div>` : ''}
                </div>
                ${images.length > 1 ? `
                    <div class="gallery-thumbs">
                        ${images.slice(1, 5).map(img => `<img src="${img}" alt="" class="gallery-thumb clickable">`).join('')}
                        ${images.length > 5 ? `<div class="gallery-more">+${images.length - 5} more</div>` : ''}
                    </div>
                ` : ''}
            `;
        } else {
            galleryHTML = `<img src="${mainImage}" alt="${account.title}" class="account-image">`;
        }

        let adminButtonsHTML = '';
        if (isLoggedIn) {
            adminButtonsHTML = `
                <div class="admin-buttons">
                    <button class="toggle-status-btn" onclick="toggleStatus(${account.id})">🔄 ${status === 'AVAILABLE' ? 'Mark as SOLD' : 'Mark as AVAILABLE'}</button>
                    <button class="edit-btn" onclick="editAccount(${account.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteAccount(${account.id})">🗑️ Delete</button>
                </div>
            `;
        }

        card.innerHTML = `
            ${galleryHTML}
            <div class="account-content">
                <div class="account-meta">
                    <span class="post-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${formatDate(account.createdAt)}
                    </span>
                    <span class="account-status status-${status.toLowerCase()}">${status}</span>
                    <span class="feature-tag">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </div>
                <h3 class="account-title">${account.title}</h3>
                <div class="account-price">₱${account.price.toFixed(2)}</div>
                <p class="account-description">${account.description}</p>
                <div class="account-features">
                    ${featuresHTML}
                </div>
                ${adminButtonsHTML}
            </div>
        `;
        
        fragment.appendChild(card);

        const clickableImages = card.querySelectorAll('.clickable');
        clickableImages.forEach((img) => {
            img.addEventListener('click', () => openLightbox(account.images, 0));
        });
    });
    
    grid.appendChild(fragment);
}

function openLightbox(images, startIndex) {
    if (!images || images.length === 0) return;
    currentLightboxImages = images;
    currentLightboxIndex = startIndex;
    updateLightbox();
    document.getElementById('lightbox').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

function updateLightbox() {
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    img.src = currentLightboxImages[currentLightboxIndex];
    counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
}

function nextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
    updateLightbox();
}

function prevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    updateLightbox();
}

function editAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    document.getElementById('editingAccountId').value = accountId;
    document.getElementById('accountTitle').value = account.title;
    document.getElementById('accountPrice').value = account.price;
    document.getElementById('accountStatus').value = account.status || 'AVAILABLE';
    document.getElementById('accountCategory').value = account.category || 'account';
    document.getElementById('accountDescription').value = account.description;
    
    tempImages = [...account.images];
    tempFeatures = [...account.features];
    
    renderTempImages();
    renderTempFeatures();
    
    document.getElementById('modalTitle').textContent = 'Edit Roblox Account';
    document.getElementById('submitBtn').textContent = 'Save Changes';
    
    document.getElementById('addAccountModal').style.display = 'block';
}

function toggleStatus(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
        account.status = account.status === 'AVAILABLE' ? 'SOLD' : 'AVAILABLE';
        saveAccounts();
        renderAccounts();
    }
}

function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this account?')) {
        accounts = accounts.filter(a => a.id !== accountId);
        saveAccounts();
        renderAccounts();
    }
}

function updateAdminControls() {
    const adminControls = document.getElementById('adminControls');
    if (isLoggedIn) {
        adminControls.style.display = 'block';
    } else {
        adminControls.style.display = 'none';
    }
}

// Modal handlers
const addBtn = document.getElementById('addAccountBtn');
const settingsBtn = document.getElementById('settingsBtn');
const closeButtons = document.querySelectorAll('.close');

addBtn.addEventListener('click', () => {
    document.getElementById('editingAccountId').value = '';
    document.getElementById('addAccountForm').reset();
    tempFeatures = [];
    tempImages = [];
    featuresList.innerHTML = '';
    imagePreview.innerHTML = '';
    document.getElementById('modalTitle').textContent = 'Add New Roblox Account';
    document.getElementById('submitBtn').textContent = 'Add Account';
    document.getElementById('addAccountModal').style.display = 'block';
});

settingsBtn.addEventListener('click', () => {
    if (isLoggedIn) {
        document.getElementById('settingsModal').style.display = 'block';
    } else {
        document.getElementById('passwordModal').style.display = 'block';
    }
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
    if (e.target === document.getElementById('lightbox')) {
        closeLightbox();
    }
});

// Password form
document.getElementById('passwordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('passwordError');
    
    if (password === getPassword()) {
        isLoggedIn = true;
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        errorEl.textContent = '';
        updateAdminControls();
        renderAccounts();
    } else {
        errorEl.textContent = 'Incorrect password!';
        errorEl.style.color = '#ef4444';
    }
});

// Settings
document.getElementById('logoutBtn').addEventListener('click', () => {
    isLoggedIn = false;
    updateAdminControls();
    renderAccounts();
    document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('changePasswordBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('changePasswordModal').style.display = 'block';
});

document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('changePasswordError');
    
    if (currentPassword !== getPassword()) {
        errorEl.textContent = 'Current password is incorrect!';
        errorEl.style.color = '#ef4444';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match!';
        errorEl.style.color = '#ef4444';
        return;
    }
    
    if (newPassword.length < 4) {
        errorEl.textContent = 'Password must be at least 4 characters!';
        errorEl.style.color = '#ef4444';
        return;
    }
    
    setPassword(newPassword);
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
    errorEl.textContent = '';
    alert('Password changed successfully!');
});

// Image handling
document.getElementById('accountImageFile').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            tempImages.push(event.target.result);
            renderTempImages();
        };
        reader.readAsDataURL(file);
    });
});

document.getElementById('addUrlBtn').addEventListener('click', () => {
    const url = document.getElementById('accountImage').value.trim();
    if (url) {
        tempImages.push(url);
        renderTempImages();
        document.getElementById('accountImage').value = '';
    }
});

document.getElementById('accountImage').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('addUrlBtn').click();
    }
});

function renderTempImages() {
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    tempImages.forEach((img, index) => {
        const container = document.createElement('div');
        container.className = 'temp-image-container';
        container.innerHTML = `
            <img src="${img}" alt="Preview" class="preview-img">
            <button type="button" class="remove-image-btn" onclick="removeTempImage(${index})">&times;</button>
        `;
        imagePreview.appendChild(container);
    });
}

function removeTempImage(index) {
    tempImages.splice(index, 1);
    renderTempImages();
}

// Features handling
document.getElementById('addFeatureBtn').addEventListener('click', () => {
    const featureInput = document.getElementById('featureInput');
    if (featureInput.value.trim()) {
        tempFeatures.push(featureInput.value.trim());
        renderTempFeatures();
        featureInput.value = '';
    }
});

document.getElementById('featureInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('addFeatureBtn').click();
    }
});

function renderTempFeatures() {
    const featuresList = document.getElementById('featuresList');
    featuresList.innerHTML = '';
    tempFeatures.forEach((feature, index) => {
        const tag = document.createElement('span');
        tag.className = 'feature-tag';
        tag.textContent = feature;
        tag.onclick = () => {
            tempFeatures.splice(index, 1);
            renderTempFeatures();
        };
        featuresList.appendChild(tag);
    });
}

// Add/Edit form
document.getElementById('addAccountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const editingId = document.getElementById('editingAccountId').value;
    const accountStatus = document.getElementById('accountStatus').value;
    const accountCategory = document.getElementById('accountCategory').value;
    
    if (editingId) {
        // Edit existing account
        const accountIndex = accounts.findIndex(a => a.id === parseInt(editingId));
        if (accountIndex !== -1) {
            accounts[accountIndex] = {
                ...accounts[accountIndex],
                title: document.getElementById('accountTitle').value,
                price: parseFloat(document.getElementById('accountPrice').value),
                status: accountStatus,
                category: accountCategory,
                description: document.getElementById('accountDescription').value,
                images: [...tempImages],
                features: [...tempFeatures]
            };
        }
    } else {
        // Add new account
        const newAccount = {
            id: Date.now(),
            title: document.getElementById('accountTitle').value,
            price: parseFloat(document.getElementById('accountPrice').value),
            status: accountStatus,
            category: accountCategory,
            description: document.getElementById('accountDescription').value,
            images: [...tempImages],
            features: [...tempFeatures],
            createdAt: Date.now()
        };
        
        accounts.unshift(newAccount);
    }
    
    saveAccounts();
    renderAccounts();
    
    document.getElementById('addAccountModal').style.display = 'none';
    document.getElementById('addAccountForm').reset();
    tempFeatures = [];
    tempImages = [];
    document.getElementById('featuresList').innerHTML = '';
    document.getElementById('imagePreview').innerHTML = '';
});

// Lightbox
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', prevImage);
document.querySelector('.lightbox-next').addEventListener('click', nextImage);

document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    }
});

// Filter button event listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filterType = btn.getAttribute('data-filter');
        
        if (filterType === 'all-status' || filterType === 'available' || filterType === 'sold') {
            // It's a status filter
            currentStatusFilter = filterType;
            // Update active state for status filters
            document.querySelectorAll('.filter-btn[data-filter^="all-status"], .filter-btn[data-filter="available"], .filter-btn[data-filter="sold"]').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        } else {
            // It's a category filter
            currentCategoryFilter = filterType;
            // Update active state for category filters
            document.querySelectorAll('.filter-btn[data-filter^="all-category"], .filter-btn[data-filter="account"], .filter-btn[data-filter="items"], .filter-btn[data-filter="robux"]').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
        }
        
        renderAccounts();
    });
});

// Handle image paste events
document.addEventListener('paste', function(e) {
    const addAccountModal = document.getElementById('addAccountModal');
    // Only handle pastes when the add/edit modal is open
    if (addAccountModal.style.display === 'block') {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = function(event) {
                    tempImages.push(event.target.result);
                    renderTempImages();
                };
                reader.readAsDataURL(blob);
            }
        }
    }
});

// Music player event listeners
document.getElementById('playAllBtn').addEventListener('click', playMusic);
document.getElementById('pauseAllBtn').addEventListener('click', pauseMusic);
document.getElementById('volumeControl').addEventListener('input', (e) => {
    setVolume(e.target.value);
});
document.getElementById('musicSelect').addEventListener('change', () => {
    if (currentAudio && !currentAudio.paused) {
        playMusic();
    }
});

// Try to autoplay on page load
window.addEventListener('load', () => {
    playMusic();
});

// Initialize
updateAdminControls();
loadAccounts(); // Load accounts from Firebase when the page loads
