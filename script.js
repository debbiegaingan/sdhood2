// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpKLAIDdoM-xGFvoqq_5c1HFFJQ2EzrPw",
  authDomain: "jamesshop.firebaseapp.com",
  databaseURL: "https://jamesshop-default-rtdb.firebaseio.com",
  projectId: "jamesshop",
  storageBucket: "jamesshop.appspot.com",
  messagingSenderId: "872242106405",
  appId: "1:872242106405:web:018d3e44152e7e6319efcc",
  measurementId: "G-C8J9KLZHRW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// State
let currentUser = null;
let currentFilterStatus = 'all-status';
let currentFilterCategory = 'all-category';
let tempImages = [];
let tempFeatures = [];
let editingAccountId = null;

// DOM Elements
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const addAccountModal = document.getElementById('addAccountModal');
const passwordModal = document.getElementById('passwordModal');
const settingsModal = document.getElementById('settingsModal');
const changePasswordModal = document.getElementById('changePasswordModal');
const lightbox = document.getElementById('lightbox');
const accountsGrid = document.getElementById('accountsGrid');
const chatMessagesDiv = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');

// Auth State Listener
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    // User is signed in
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    userNameSpan.textContent = user.displayName || user.email;
    loadAccounts();
    loadChatMessages();
  } else {
    // User is signed out
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
  }
});

// Tab Switching
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loginError.textContent = '';
    })
    .catch((error) => {
      loginError.textContent = error.message;
    });
});

// Register
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      return userCredential.user.updateProfile({
        displayName: name
      });
    })
    .then(() => {
      registerError.textContent = '';
    })
    .catch((error) => {
      registerError.textContent = error.message;
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

document.getElementById('logoutBtn2').addEventListener('click', () => {
  auth.signOut();
  settingsModal.style.display = 'none';
});

// Settings Modal
document.getElementById('settingsBtn').addEventListener('click', () => {
  settingsModal.style.display = 'flex';
});

document.getElementById('changePasswordBtn').addEventListener('click', () => {
  changePasswordModal.style.display = 'flex';
  settingsModal.style.display = 'none';
});

// Password Modal
let isAdmin = false;
const ADMIN_PASSWORD_KEY = 'admin_password';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

document.getElementById('addAccountBtn').addEventListener('click', () => {
  const savedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  passwordModal.style.display = 'flex';
  document.getElementById('passwordError').textContent = '';
  document.getElementById('passwordInput').value = '';
});

document.getElementById('passwordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inputPassword = document.getElementById('passwordInput').value;
  const savedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  
  if (inputPassword === savedPassword) {
    isAdmin = true;
    passwordModal.style.display = 'none';
    openAddAccountModal();
  } else {
    document.getElementById('passwordError').textContent = 'Incorrect password!';
  }
});

// Change Password
document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const savedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  
  if (currentPassword !== savedPassword) {
    document.getElementById('changePasswordError').textContent = 'Current password is incorrect!';
    return;
  }
  
  if (newPassword !== confirmPassword) {
    document.getElementById('changePasswordError').textContent = 'Passwords do not match!';
    return;
  }
  
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  document.getElementById('changePasswordError').textContent = 'Password changed successfully!';
  
  setTimeout(() => {
    changePasswordModal.style.display = 'none';
    document.getElementById('changePasswordError').textContent = '';
  }, 1500);
});

// Filter Buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const filter = e.target.dataset.filter;
    
    if (filter.includes('status')) {
      currentFilterStatus = filter;
      document.querySelectorAll('.filter-section:first-child .filter-btn').forEach(b => b.classList.remove('active'));
    } else {
      currentFilterCategory = filter;
      document.querySelectorAll('.filter-section:last-child .filter-btn').forEach(b => b.classList.remove('active'));
    }
    
    e.target.classList.add('active');
    loadAccounts();
  });
});

// Add Account Modal Functions
function openAddAccountModal(account = null) {
  editingAccountId = account ? account.id : null;
  
  document.getElementById('modalTitle').textContent = account ? 'Edit Account' : 'Add New Roblox Account';
  document.getElementById('submitBtn').textContent = account ? 'Update Account' : 'Add Account';
  
  if (account) {
    document.getElementById('accountTitle').value = account.title;
    document.getElementById('accountPrice').value = account.price;
    document.getElementById('accountStatus').value = account.status;
    document.getElementById('accountCategory').value = account.category || 'account';
    document.getElementById('accountDescription').value = account.description;
    tempImages = [...(account.images || [])];
    tempFeatures = [...(account.features || [])];
  } else {
    document.getElementById('accountTitle').value = '';
    document.getElementById('accountPrice').value = '';
    document.getElementById('accountStatus').value = 'AVAILABLE';
    document.getElementById('accountCategory').value = 'account';
    document.getElementById('accountDescription').value = '';
    tempImages = [];
    tempFeatures = [];
  }
  
  renderTempImages();
  renderTempFeatures();
  addAccountModal.style.display = 'flex';
}

document.querySelectorAll('.modal .close').forEach(closeBtn => {
  closeBtn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    modal.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Image Handling
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
  e.target.value = '';
});

document.getElementById('addUrlBtn').addEventListener('click', () => {
  const url = document.getElementById('accountImage').value;
  if (url) {
    tempImages.push(url);
    renderTempImages();
    document.getElementById('accountImage').value = '';
  }
});

// Handle paste images for both account modal and chat
document.addEventListener('paste', function(e) {
  if (addAccountModal && addAccountModal.style.display === 'flex') {
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
  } else if (currentUser) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        uploadChatImage(blob);
      }
    }
  }
});

function renderTempImages() {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = tempImages.map((img, index) => `
    <div class="temp-image-container">
      <img src="${img}" class="preview-img" alt="Preview ${index + 1}">
      <button type="button" class="remove-image-btn" onclick="removeTempImage(${index})">&times;</button>
    </div>
  `).join('');
}

function removeTempImage(index) {
  tempImages.splice(index, 1);
  renderTempImages();
}

// Features Handling
document.getElementById('addFeatureBtn').addEventListener('click', () => {
  const featureInput = document.getElementById('featureInput');
  const feature = featureInput.value.trim();
  if (feature) {
    tempFeatures.push(feature);
    featureInput.value = '';
    renderTempFeatures();
  }
});

function renderTempFeatures() {
  const featuresList = document.getElementById('featuresList');
  featuresList.innerHTML = tempFeatures.map((feature, index) => `
    <span class="feature-tag" onclick="removeTempFeature(${index})">✕ ${feature}</span>
  `).join('');
}

function removeTempFeature(index) {
  tempFeatures.splice(index, 1);
  renderTempFeatures();
}

// Add/Edit Account Form
document.getElementById('addAccountForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const account = {
    title: document.getElementById('accountTitle').value,
    price: parseFloat(document.getElementById('accountPrice').value),
    status: document.getElementById('accountStatus').value,
    category: document.getElementById('accountCategory').value,
    description: document.getElementById('accountDescription').value,
    images: tempImages,
    features: tempFeatures,
    createdAt: Date.now()
  };
  
  if (editingAccountId) {
    database.ref('accounts/' + editingAccountId).update(account);
  } else {
    database.ref('accounts').push(account);
  }
  
  addAccountModal.style.display = 'none';
});

// Load Accounts
function loadAccounts() {
  database.ref('accounts').orderByChild('createdAt').on('value', (snapshot) => {
    const accountsData = snapshot.val();
    let accounts = [];
    
    if (accountsData) {
      accounts = Object.keys(accountsData).map(key => ({
        id: key,
        ...accountsData[key]
      }));
    }
    
    // Newest first
    accounts.sort((a, b) => b.createdAt - a.createdAt);
    
    // Filter
    const filteredAccounts = accounts.filter(account => {
      let statusMatch = true;
      let categoryMatch = true;
      
      if (currentFilterStatus === 'available') {
        statusMatch = account.status === 'AVAILABLE';
      } else if (currentFilterStatus === 'sold') {
        statusMatch = account.status === 'SOLD';
      }
      
      if (currentFilterCategory !== 'all-category') {
        categoryMatch = account.category === currentFilterCategory;
      }
      
      return statusMatch && categoryMatch;
    });
    
    renderAccounts(filteredAccounts);
  });
}

function renderAccounts(accounts) {
  accountsGrid.innerHTML = accounts.map(account => `
    <div class="account-card">
      <div class="gallery-main">
        <img src="${account.images[0] || 'https://via.placeholder.com/400x220?text=No+Image'}" 
             class="account-image ${account.images.length > 1 ? 'clickable' : ''}" 
             alt="${account.title}"
             ${account.images.length > 1 ? `onclick="openLightbox('${account.id}', 0)"` : ''}>
        ${account.images.length > 1 ? `<span class="image-count">+${account.images.length - 1}</span>` : ''}
      </div>
      ${account.images.length > 1 ? `
        <div class="gallery-thumbs">
          ${account.images.slice(0, 5).map((img, i) => `
            <img src="${img}" class="gallery-thumb clickable" onclick="openLightbox('${account.id}', ${i})" alt="Thumbnail ${i + 1}">
          `).join('')}
          ${account.images.length > 5 ? `<div class="gallery-more">+${account.images.length - 5}</div>` : ''}
        </div>
      ` : ''}
      <div class="account-content">
        <div class="account-meta">
          <span class="post-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${new Date(account.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span class="account-status status-${account.status.toLowerCase()}">${account.status}</span>
          <span class="feature-tag">${account.category || 'account'}</span>
        </div>
        <h3 class="account-title">${account.title}</h3>
        <p class="account-price">₱${account.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p class="account-description">${account.description}</p>
        <div class="account-features">
          ${account.features.map(feature => `<span class="feature-tag">✓ ${feature}</span>`).join('')}
        </div>
        ${isAdmin ? `
          <div class="admin-buttons">
            <button class="toggle-status-btn" onclick="toggleAccountStatus('${account.id}')">Toggle Status</button>
            <button class="edit-btn" onclick="openAddAccountModal(accounts.find(a => a.id === '${account.id}'))">Edit</button>
            <button class="delete-btn" onclick="deleteAccount('${account.id}')">Delete</button>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Toggle Account Status
function toggleAccountStatus(id) {
  database.ref('accounts/' + id).once('value', (snapshot) => {
    const account = snapshot.val();
    const newStatus = account.status === 'AVAILABLE' ? 'SOLD' : 'AVAILABLE';
    database.ref('accounts/' + id).update({ status: newStatus });
  });
}

// Delete Account
function deleteAccount(id) {
  if (confirm('Are you sure you want to delete this account?')) {
    database.ref('accounts/' + id).remove();
  }
}

// Lightbox
let currentLightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(accountId, index) {
  database.ref('accounts/' + accountId).once('value', (snapshot) => {
    const account = snapshot.val();
    currentLightboxImages = account.images;
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.style.display = 'flex';
  });
}

function updateLightbox() {
  const img = document.getElementById('lightbox-img');
  const counter = document.getElementById('lightbox-counter');
  
  img.src = currentLightboxImages[currentLightboxIndex];
  counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
}

document.querySelector('.lightbox-close').addEventListener('click', () => {
  lightbox.style.display = 'none';
});

document.querySelector('.lightbox-prev').addEventListener('click', () => {
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
  updateLightbox();
});

document.querySelector('.lightbox-next').addEventListener('click', () => {
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
  updateLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.style.display === 'flex') {
    if (e.key === 'Escape') {
      lightbox.style.display = 'none';
    } else if (e.key === 'ArrowLeft') {
      currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
      updateLightbox();
    } else if (e.key === 'ArrowRight') {
      currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
      updateLightbox();
    }
  }
});

// Chat Functions
function loadChatMessages() {
  database.ref('chat').orderByChild('timestamp').limitToLast(100).on('value', (snapshot) => {
    const messagesData = snapshot.val();
    let messages = [];
    
    if (messagesData) {
      messages = Object.keys(messagesData).map(key => ({
        id: key,
        ...messagesData[key]
      }));
    }
    
    renderChatMessages(messages);
  });
}

function renderChatMessages(messages) {
  chatMessagesDiv.innerHTML = messages.map(message => {
    const isOwn = message.uid === currentUser.uid;
    return `
      <div class="chat-message ${isOwn ? 'own' : 'other'}">
        <span class="message-author">${message.displayName}</span>
        ${message.text ? `<div>${message.text}</div>` : ''}
        ${message.imageUrl ? `<img src="${message.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" onclick="window.open('${message.imageUrl}', '_blank')">` : ''}
      </div>
    `;
  }).join('');
  
  // Scroll to bottom
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const chatInput = document.getElementById('chatInput');
  const text = chatInput.value.trim();
  
  if (text && currentUser) {
    database.ref('chat').push({
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email,
      text: text,
      timestamp: Date.now()
    });
    chatInput.value = '';
  }
});



function uploadChatImage(blob) {
  if (!currentUser) return;
  
  const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
  const storageRef = storage.ref('chat_images/' + fileName);
  
  storageRef.put(blob).then((snapshot) => {
    return snapshot.ref.getDownloadURL();
  }).then((downloadURL) => {
    database.ref('chat').push({
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email,
      imageUrl: downloadURL,
      timestamp: Date.now()
    });
  }).catch((error) => {
    console.error('Error uploading image:', error);
    alert('Error uploading image!');
  });
}

// Update Admin Controls
function updateAdminControls() {
  const controls = document.getElementById('adminControls');
  controls.style.display = 'block';
}

// Initialize
updateAdminControls();
