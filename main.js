// --- CONFIGURATION ---
const SUPABASE_URL = "https://agbtxbdgjblymnpqpmym.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnR4YmRnamJseW1ucHFwbXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjQwMTAsImV4cCI6MjA3OTg0MDAxMH0.kBh6F82SJzL1T7V5FrGh_A8AFMI93oEq0spLHNFrsTk";

// Initialize Supabase Client
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE MANAGEMENT ---
const state = {
  user: null,
  products: [], // All products fetched from DB
  sizes: [],
  genders: [],
  tracker: null,
  filters: {
    size: '',
    gender: '',
    searchId: '' // Added search by ID
  },
  // Pagination State
  pagination: {
    limit: 20,
    currentPage: 1,
    filteredItems: [], // Items after applying size/gender filters
    isLoading: false,
    hasMore: true
  },
  // Admin Pagination State
  adminPagination: {
    limit: 20,
    currentPage: 1,
    filteredItems: [],
    searchId: ''
  },
  // Upload State
  uploadFile: null // Track the current file to be uploaded (Original -> AI -> Compressed)
};

// --- DOM ELEMENTS ---
const els = {
  homePage: document.getElementById('home-page'),
  loginPage: document.getElementById('login-page'),
  adminDashboard: document.getElementById('admin-dashboard'),
  adminLoginBtn: document.getElementById('admin-login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  backToHomeBtn: document.getElementById('back-to-home'),
  loginForm: document.getElementById('login-form'),
  notificationArea: document.getElementById('notification-area'),
  productsGrid: document.getElementById('products-grid'),
  filterSize: document.getElementById('filter-size'),
  filterGender: document.getElementById('filter-gender'),
  searchId: document.getElementById('search-id'), // Public Search
  scrollLoader: document.getElementById('scroll-loader'),
  
  // Modal Elements
  imageModal: document.getElementById('image-modal'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalImage: document.getElementById('modal-image'),
  modalClose: document.getElementById('modal-close'),
  modalDownload: document.getElementById('modal-download'),

  // Admin Elements
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  addProductForm: document.getElementById('add-product-form'),
  productSizeSelect: document.getElementById('product-size'),
  productGenderSelect: document.getElementById('product-gender'),
  productsTableBody: document.querySelector('#products-table tbody'),
  adminSearchId: document.getElementById('admin-search-id'), // Admin Search
  adminLoadMoreBtn: document.getElementById('admin-load-more-btn'), // Admin Load More
  sizesList: document.getElementById('sizes-list'),
  gendersList: document.getElementById('genders-list'),
  addSizeBtn: document.getElementById('add-size-btn'),
  newSizeVal: document.getElementById('new-size-val'),
  addGenderBtn: document.getElementById('add-gender-btn'),
  newGenderVal: document.getElementById('new-gender-val'),
  trackerText: document.getElementById('tracker-text'),
  trackerDate: document.getElementById('tracker-date'),
  trackerStatus: document.getElementById('tracker-status'),
  updateTrackerBtn: document.getElementById('update-tracker-btn'),

  // AI & Upload Elements
  productImageInput: document.getElementById('product-image'),
  imagePreviewContainer: document.getElementById('image-preview-container'),
  imagePreview: document.getElementById('image-preview'),
  aiEditBtn: document.getElementById('ai-edit-btn'),
  compressBtn: document.getElementById('compress-btn'),
  aiApiKeyInput: document.getElementById('ai-api-key'), // New Input

  // Bulk Actions
  sizesBulkToolbar: document.getElementById('sizes-bulk-toolbar'),
  selectAllSizes: document.getElementById('select-all-sizes'),
  deleteSelectedSizesBtn: document.getElementById('delete-selected-sizes'),
  
  gendersBulkToolbar: document.getElementById('genders-bulk-toolbar'),
  selectAllGenders: document.getElementById('select-all-genders'),
  deleteSelectedGendersBtn: document.getElementById('delete-selected-genders'),
};

// --- UTILITIES ---
const toPersianNum = (num) => {
  if (num === null || num === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, x => farsiDigits[x]);
};

const formatPrice = (price) => {
  if (!price) return '۰ تومان';
  return toPersianNum(price.toLocaleString()) + ' تومان';
};

const toJalaliDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const showNotification = (message, type = 'success') => {
  const div = document.createElement('div');
  div.className = `notification ${type === 'success' ? 'notif-success' : 'notif-error'}`;
  div.textContent = message;
  els.notificationArea.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 300);
  }, 3000);
};

// Improved Copy Function with Fallback
window.copyProductId = (id, event) => {
    if(event) {
        event.stopPropagation(); // Prevent modal opening
        event.preventDefault();
    }
    
    const text = String(id);
    
    // Try modern API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`شناسه محصول کپی شد: ${text}`);
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
};

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's not visible but part of DOM
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification(`شناسه محصول کپی شد: ${text}`);
        } else {
            showNotification('خطا در کپی شناسه', 'error');
        }
    } catch (err) {
        showNotification('خطا در کپی شناسه', 'error');
    }
    
    document.body.removeChild(textArea);
}

// --- MODAL LOGIC ---
window.openImageModal = (imageUrl) => {
    els.modalImage.src = imageUrl;
    els.modalDownload.href = imageUrl;
    els.imageModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

const closeImageModal = () => {
    els.imageModal.classList.remove('active');
    els.modalImage.src = ''; // Clear src to stop loading
    document.body.style.overflow = '';
};

els.modalClose.addEventListener('click', closeImageModal);
els.modalOverlay.addEventListener('click', closeImageModal);

// Add ESC key listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.imageModal.classList.contains('active')) {
        closeImageModal();
    }
});

// --- NAVIGATION ---
const navigateTo = (page) => {
  els.homePage.classList.add('hidden');
  els.loginPage.classList.add('hidden');
  els.adminDashboard.classList.add('hidden');
  
  if (page === 'home') els.homePage.classList.remove('hidden');
  if (page === 'login') els.loginPage.classList.remove('hidden');
  if (page === 'admin') {
    if (!state.user) {
      navigateTo('login');
      return;
    }
    els.adminDashboard.classList.remove('hidden');
    loadAdminData();
  }
  updateHeader();
};

const updateHeader = () => {
  if (state.user) {
    els.adminLoginBtn.classList.add('hidden');
    els.logoutBtn.classList.remove('hidden');
  } else {
    els.adminLoginBtn.classList.remove('hidden');
    els.logoutBtn.classList.add('hidden');
  }
};

// --- DATA FETCHING ---
const fetchInitialData = async () => {
  try {
    els.productsGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>در حال دریافت محصولات...</p></div>';

    const [sizesRes, gendersRes, productsRes] = await Promise.all([
      supabase.from('sizes').select('*').order('value'),
      supabase.from('genders').select('*').order('value'),
      supabase.from('products').select('*, sizes(value), genders(value)').order('created_at', { ascending: false })
    ]);

    if (sizesRes.error) throw sizesRes.error;
    if (gendersRes.error) throw gendersRes.error;
    if (productsRes.error) throw productsRes.error;

    state.sizes = sizesRes.data;
    state.genders = gendersRes.data;
    state.products = productsRes.data;

    renderFilters();
    
    // Initial Gallery Render (Reset Pagination)
    filterAndResetGallery();
    
  } catch (err) {
    console.error(err);
    showNotification('خطا در دریافت اطلاعات', 'error');
    els.productsGrid.innerHTML = '<p class="error-msg">خطا در بارگذاری محصولات</p>';
  }
};

// --- RENDER FUNCTIONS ---
const renderFilters = () => {
  const sizeOptions = state.sizes.map(s => `<option value="${s.id}">${toPersianNum(s.value)}</option>`).join('');
  const genderOptions = state.genders.map(g => `<option value="${g.id}">${g.value}</option>`).join('');
  
  if (els.filterSize.children.length <= 1) {
      els.filterSize.innerHTML = `<option value="">همه سایزها</option>` + sizeOptions;
  }
  if (els.filterGender.children.length <= 1) {
      els.filterGender.innerHTML = `<option value="">همه</option>` + genderOptions;
  }

  els.productSizeSelect.innerHTML = `<option value="">انتخاب کنید</option>` + sizeOptions;
  els.productGenderSelect.innerHTML = `<option value="">انتخاب کنید</option>` + genderOptions;
};

// --- PAGINATION & GALLERY LOGIC ---

// 1. Prepare list & Reset (Called on Load or Filter Change)
const filterAndResetGallery = () => {
  const { size, gender, searchId } = state.filters;
  
  // Apply filters to full list
  state.pagination.filteredItems = state.products.filter(p => {
    const matchSize = size ? p.size_id == size : true;
    const matchGender = gender ? p.gender_id == gender : true;
    const matchId = searchId ? p.id == searchId : true;
    return matchSize && matchGender && matchId;
  });

  // Reset Pagination State
  state.pagination.currentPage = 1;
  state.pagination.hasMore = true;
  state.pagination.isLoading = false;
  
  // Clear Grid
  els.productsGrid.innerHTML = '';
  
  if (state.pagination.filteredItems.length === 0) {
    els.productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 1.1rem;">محصولی با این مشخصات یافت نشد.</p>';
    els.scrollLoader.classList.add('hidden');
    return;
  }

  // Load First Batch
  loadNextBatch();
};

// 2. Append Items (Called by Reset or Scroll)
const loadNextBatch = () => {
  if (state.pagination.isLoading || !state.pagination.hasMore) return;
  
  state.pagination.isLoading = true;
  els.scrollLoader.classList.remove('hidden');

  // Calculate slice
  const { limit, currentPage, filteredItems } = state.pagination;
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const itemsToRender = filteredItems.slice(start, end);

  // Check if this is the last batch
  if (end >= filteredItems.length) {
    state.pagination.hasMore = false;
  }

  // Simulate small delay for UX (optional, but looks better)
  setTimeout(() => {
    const html = itemsToRender.map(p => `
      <div class="product-card">
        <div class="image-container" onclick="openImageModal('${p.image_url}')">
          <img src="${p.image_url}" alt="کفش" class="product-image" loading="lazy" />
          <div class="product-price-tag">${formatPrice(p.price)}</div>
        </div>
        <div class="product-info">
          <div class="product-meta">
            <span class="badge size-badge">${toPersianNum(p.sizes?.value || '-')}</span>
            <span class="badge gender-badge">${p.genders?.value || '-'}</span>
          </div>
          <button class="btn-copy-id" onclick="copyProductId(${p.id}, event)">
            <i class="fa-regular fa-copy"></i> کپی شناسه محصول
          </button>
        </div>
      </div>
    `).join('');

    els.productsGrid.insertAdjacentHTML('beforeend', html);
    
    state.pagination.currentPage++;
    state.pagination.isLoading = false;
    
    if (!state.pagination.hasMore) {
      els.scrollLoader.classList.add('hidden');
    }
  }, 300); // 300ms delay for smooth feel
};

// 3. Scroll Event Listener
window.addEventListener('scroll', () => {
  // Only run on home page
  if (els.homePage.classList.contains('hidden')) return;

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  
  // If scrolled near bottom (within 300px)
  if (scrollTop + clientHeight >= scrollHeight - 300) {
    loadNextBatch();
  }
});

// --- ADMIN LOGIC ---
const handleLogin = async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) throw new Error('Invalid credentials');

    if (data.password === password) {
      state.user = { username: data.username };
      localStorage.setItem('mirza_admin', JSON.stringify(state.user));
      showNotification('خوش آمدید');
      navigateTo('admin');
    } else {
      throw new Error('Wrong password');
    }
  } catch (err) {
    showNotification('نام کاربری یا رمز عبور اشتباه است', 'error');
  }
};

const loadAdminData = async () => {
  state.adminPagination.currentPage = 1;
  state.adminPagination.searchId = '';
  if(els.adminSearchId) els.adminSearchId.value = '';
  
  // Load API Key from LocalStorage
  const savedKey = localStorage.getItem('mirza_ai_key');
  if (savedKey) els.aiApiKeyInput.value = savedKey;

  renderAdminProducts();
  renderAdminSizes();
  renderAdminGenders();
  checkTracker();
};

// --- ADMIN: PRODUCTS & AI UPLOAD ---

// Handle File Selection to show Preview
const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        state.uploadFile = file; // Set initial file
        els.imagePreview.src = URL.createObjectURL(file);
        els.imagePreviewContainer.classList.remove('hidden');
        els.compressBtn.disabled = true; // Disable compress until AI is done
    } else {
        state.uploadFile = null;
        els.imagePreviewContainer.classList.add('hidden');
    }
};

// Handle AI Edit
const handleAiEdit = async () => {
    if (!state.uploadFile) {
        showNotification('لطفا ابتدا یک تصویر انتخاب کنید', 'error');
        return;
    }

    // Get API Key from input or localStorage
    let apiKey = els.aiApiKeyInput.value.trim();
    if (!apiKey) {
        apiKey = localStorage.getItem('mirza_ai_key');
    }

    if (!apiKey) {
        showNotification('لطفا کلید API سرویس remove.bg را وارد کنید', 'error');
        els.aiApiKeyInput.focus();
        return;
    }

    // Save key for future use
    localStorage.setItem('mirza_ai_key', apiKey);

    const originalBtnText = els.aiEditBtn.innerHTML;
    els.aiEditBtn.innerHTML = '<div class="loading-spinner small-spinner"></div> در حال پردازش AI...';
    els.aiEditBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('image_file', state.uploadFile);
        formData.append('size', 'auto');

        // Call remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.errors?.[0]?.title || response.statusText);
        }

        const blob = await response.blob();
        
        // Create new File object
        const newFileName = "ai_" + state.uploadFile.name.replace(/\.[^/.]+$/, "") + ".png";
        const newFile = new File([blob], newFileName, { type: "image/png" });
        
        // Update State
        state.uploadFile = newFile;

        // Update Preview
        els.imagePreview.src = URL.createObjectURL(newFile);
        
        showNotification('تصویر با هوش مصنوعی ویرایش شد!');
        els.compressBtn.disabled = false; // Enable compression
    } catch (error) {
        console.error(error);
        showNotification('خطا در سرویس AI: ' + error.message, 'error');
    } finally {
        els.aiEditBtn.innerHTML = originalBtnText;
        els.aiEditBtn.disabled = false;
    }
};

// Handle Compression (Client-Side Canvas)
const handleCompress = async () => {
    if (!state.uploadFile) return;

    const originalBtnText = els.compressBtn.innerHTML;
    els.compressBtn.innerHTML = '<div class="loading-spinner small-spinner"></div> در حال فشرده‌سازی...';
    els.compressBtn.disabled = true;

    try {
        // Create an image element to load the file
        const img = new Image();
        img.src = URL.createObjectURL(state.uploadFile);
        
        await new Promise(resolve => img.onload = resolve);

        // Create Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);

        // Convert to Blob with Quality 0.7 (Compression)
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
        
        const newFileName = "comp_" + state.uploadFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
        const compressedFile = new File([blob], newFileName, { type: "image/jpeg" });

        // Update State
        state.uploadFile = compressedFile;
        
        // Update Preview
        els.imagePreview.src = URL.createObjectURL(compressedFile);
        
        showNotification('تصویر با موفقیت فشرده شد');
    } catch (err) {
        console.error(err);
        showNotification('خطا در فشرده‌سازی', 'error');
    } finally {
        els.compressBtn.innerHTML = originalBtnText;
        els.compressBtn.disabled = true; // Disable after single use to prevent double compression
    }
};

const handleUploadProduct = async (e) => {
  e.preventDefault();
  
  // Use state.uploadFile instead of input directly
  const file = state.uploadFile;
  const price = document.getElementById('product-price').value;
  const sizeId = document.getElementById('product-size').value;
  const genderId = document.getElementById('product-gender').value;

  if (!file || !price || !sizeId || !genderId) {
    showNotification('لطفا همه فیلدها را پر کنید', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'در حال آپلود...';

  try {
    // Ensure unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shoes')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('shoes').getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('products').insert({
      image_url: publicUrl,
      price: price,
      size_id: sizeId,
      gender_id: genderId
    });

    if (dbError) throw dbError;

    showNotification('محصول با موفقیت ثبت شد');
    e.target.reset();
    state.uploadFile = null;
    els.imagePreviewContainer.classList.add('hidden'); // Hide preview after upload
    await fetchInitialData();
    renderAdminProducts();
  } catch (err) {
    console.error(err);
    showNotification('خطا در ثبت محصول: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
};

const renderAdminProducts = (append = false) => {
  const { searchId, currentPage, limit } = state.adminPagination;

  // 1. Filter
  let filtered = state.products;
  if (searchId) {
      filtered = filtered.filter(p => p.id == searchId);
  }
  state.adminPagination.filteredItems = filtered;

  // 2. Slice
  const itemsToShow = filtered.slice(0, currentPage * limit);
  
  // 3. Render
  if (filtered.length === 0) {
    els.productsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">محصولی یافت نشد</td></tr>';
    els.adminLoadMoreBtn.classList.add('hidden');
    return;
  }

  els.productsTableBody.innerHTML = itemsToShow.map(p => `
    <tr>
      <td><img src="${p.image_url}" class="thumbnail" /></td>
      <td>${p.id}</td>
      <td>
        <input type="number" value="${p.price}" onchange="updatePrice(${p.id}, this.value)" class="price-input" />
      </td>
      <td>${toPersianNum(p.sizes?.value)}</td>
      <td>${p.genders?.value}</td>
      <td>
        <button class="btn-danger btn-small" onclick="deleteProduct(${p.id})">حذف</button>
      </td>
    </tr>
  `).join('');

  // 4. Load More Button Visibility
  if (itemsToShow.length < filtered.length) {
      els.adminLoadMoreBtn.classList.remove('hidden');
  } else {
      els.adminLoadMoreBtn.classList.add('hidden');
  }
};

// Admin Search & Pagination Handlers
els.adminSearchId.addEventListener('input', (e) => {
    state.adminPagination.searchId = e.target.value;
    state.adminPagination.currentPage = 1;
    renderAdminProducts();
});

els.adminLoadMoreBtn.addEventListener('click', () => {
    state.adminPagination.currentPage++;
    renderAdminProducts(true);
});


window.updatePrice = async (id, newPrice) => {
  try {
    const price = parseFloat(newPrice);
    if (isNaN(price)) {
       showNotification('قیمت نامعتبر است', 'error');
       return;
    }

    const { error } = await supabase.from('products').update({ price: price }).eq('id', id);
    if (error) throw error;
    showNotification('قیمت به‌روز شد');
    const prod = state.products.find(p => p.id === id);
    if (prod) prod.price = price;
  } catch (err) {
    showNotification('خطا در بروزرسانی قیمت', 'error');
  }
};

window.deleteProduct = async (id) => {
  if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    showNotification('محصول حذف شد');
    await fetchInitialData(); 
    renderAdminProducts();
  } catch (err) {
    showNotification('خطا در حذف محصول', 'error');
  }
};

// --- ADMIN: SIZES & GENDERS (Updated UI with Cards & Selection) ---
const renderAdminSizes = () => {
  if (state.sizes.length > 0) {
      els.sizesBulkToolbar.classList.remove('hidden');
  } else {
      els.sizesBulkToolbar.classList.add('hidden');
  }

  els.sizesList.innerHTML = state.sizes.map(s => `
    <li class="manage-item-card" id="size-card-${s.id}">
      <div class="card-start">
        <input type="checkbox" class="custom-checkbox size-checkbox" value="${s.id}" onchange="toggleSelection('size', ${s.id})">
        <span class="item-value">${toPersianNum(s.value)}</span>
      </div>
      <button class="btn-danger btn-small" onclick="deleteSize(${s.id})"><i class="fa-solid fa-trash"></i></button>
    </li>
  `).join('');
};

const renderAdminGenders = () => {
  if (state.genders.length > 0) {
      els.gendersBulkToolbar.classList.remove('hidden');
  } else {
      els.gendersBulkToolbar.classList.add('hidden');
  }

  els.gendersList.innerHTML = state.genders.map(g => `
    <li class="manage-item-card" id="gender-card-${g.id}">
      <div class="card-start">
        <input type="checkbox" class="custom-checkbox gender-checkbox" value="${g.id}" onchange="toggleSelection('gender', ${g.id})">
        <span class="item-value">${g.value}</span>
      </div>
      <button class="btn-danger btn-small" onclick="deleteGender(${g.id})"><i class="fa-solid fa-trash"></i></button>
    </li>
  `).join('');
};

// Selection Logic (UI Only)
window.toggleSelection = (type, id) => {
    const checkboxClass = type === 'size' ? '.size-checkbox' : '.gender-checkbox';
    const cardIdPrefix = type === 'size' ? 'size-card-' : 'gender-card-';
    const deleteBtn = type === 'size' ? els.deleteSelectedSizesBtn : els.deleteSelectedGendersBtn;
    
    const card = document.getElementById(cardIdPrefix + id);
    const checkbox = card.querySelector('input[type="checkbox"]');
    
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    
    // Check if any selected to show bulk delete
    const anyChecked = document.querySelectorAll(checkboxClass + ':checked').length > 0;
    if (anyChecked) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }
};

// Bulk Selection Handlers
els.selectAllSizes.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.size-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        toggleSelection('size', cb.value);
    });
});

els.selectAllGenders.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.gender-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        toggleSelection('gender', cb.value);
    });
});

// Bulk Delete Handlers (Iterates existing delete logic)
els.deleteSelectedSizesBtn.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.size-checkbox:checked')).map(cb => cb.value);
    if (!confirm(`آیا از حذف ${selected.length} مورد اطمینان دارید؟`)) return;
    
    for (const id of selected) {
        await deleteSize(id, true); // Pass true to skip individual refresh
    }
    await fetchInitialData();
    renderAdminSizes();
    showNotification('موارد انتخاب شده حذف شدند');
    els.selectAllSizes.checked = false;
    els.deleteSelectedSizesBtn.classList.add('hidden');
});

els.deleteSelectedGendersBtn.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.gender-checkbox:checked')).map(cb => cb.value);
    if (!confirm(`آیا از حذف ${selected.length} مورد اطمینان دارید؟`)) return;
    
    for (const id of selected) {
        await deleteGender(id, true);
    }
    await fetchInitialData();
    renderAdminGenders();
    showNotification('موارد انتخاب شده حذف شدند');
    els.selectAllGenders.checked = false;
    els.deleteSelectedGendersBtn.classList.add('hidden');
});

// Existing Add/Delete Logic
const addSize = async () => {
  const val = els.newSizeVal.value.trim();
  if (!val) return;
  try {
    const { error } = await supabase.from('sizes').insert({ value: val });
    if (error) throw error;
    els.newSizeVal.value = '';
    showNotification('سایز افزوده شد');
    await fetchInitialData();
    renderAdminSizes();
  } catch (err) {
    showNotification('خطا (ممکن است تکراری باشد)', 'error');
  }
};

const addGender = async () => {
  const val = els.newGenderVal.value.trim();
  if (!val) return;
  try {
    const { error } = await supabase.from('genders').insert({ value: val });
    if (error) throw error;
    els.newGenderVal.value = '';
    showNotification('جنسیت افزوده شد');
    await fetchInitialData();
    renderAdminGenders();
  } catch (err) {
    showNotification('خطا', 'error');
  }
};

window.deleteSize = async (id, skipRefresh = false) => {
  if (!skipRefresh && !confirm('حذف سایز؟')) return;
  try {
    const { error } = await supabase.from('sizes').delete().eq('id', id);
    if (error) throw error;
    if (!skipRefresh) {
        await fetchInitialData();
        renderAdminSizes();
    }
  } catch (err) {
    if (!skipRefresh) showNotification('خطا (ممکن است استفاده شده باشد)', 'error');
  }
};

window.deleteGender = async (id, skipRefresh = false) => {
  if (!skipRefresh && !confirm('حذف جنسیت؟')) return;
  try {
    const { error } = await supabase.from('genders').delete().eq('id', id);
    if (error) throw error;
    if (!skipRefresh) {
        await fetchInitialData();
        renderAdminGenders();
    }
  } catch (err) {
    if (!skipRefresh) showNotification('خطا', 'error');
  }
};

// --- ADMIN: TRACKER ---
const checkTracker = async () => {
  const { data, error } = await supabase.from('update_tracker').select('*').limit(1).single();
  
  if (!data && !error) {
      await supabase.from('update_tracker').insert({ last_update: new Date().toISOString() });
      return checkTracker();
  }

  if (error || !data) return;

  const lastDate = new Date(data.last_update);
  const diffDays = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
  
  els.trackerStatus.className = 'tracker-box';
  let text = '';

  if (diffDays <= 3) {
    els.trackerStatus.classList.add('tracker-green');
    text = 'وضعیت خوب (کمتر از ۳ روز)';
  } else if (diffDays <= 5) {
    els.trackerStatus.classList.add('tracker-orange');
    text = 'هشدار (۳ تا ۵ روز)';
  } else {
    els.trackerStatus.classList.add('tracker-red');
    text = 'باید آپدیت شود! (بیش از ۵ روز)';
  }
  
  els.trackerText.textContent = text;
  els.trackerDate.textContent = `(${toJalaliDate(data.last_update)})`; // Show Jalali Date
};

const updateTracker = async () => {
  try {
    const { data } = await supabase.from('update_tracker').select('id').limit(1).single();
    if (!data) return;

    const { error } = await supabase
      .from('update_tracker')
      .update({ last_update: new Date().toISOString() })
      .eq('id', data.id);

    if (error) throw error;
    showNotification('زمان به‌روزرسانی ثبت شد');
    checkTracker();
  } catch (err) {
    showNotification('خطا در ثبت زمان', 'error');
  }
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  const storedUser = localStorage.getItem('mirza_admin');
  if (storedUser) state.user = JSON.parse(storedUser);
  updateHeader();

  fetchInitialData();

  els.adminLoginBtn.addEventListener('click', () => navigateTo('login'));
  els.backToHomeBtn.addEventListener('click', () => navigateTo('home'));
  els.logoutBtn.addEventListener('click', () => {
    state.user = null;
    localStorage.removeItem('mirza_admin');
    navigateTo('home');
    showNotification('خروج موفق');
  });

  els.loginForm.addEventListener('submit', handleLogin);

  // Updated: Use filterAndResetGallery instead of renderGallery
  els.filterSize.addEventListener('change', (e) => {
    state.filters.size = e.target.value;
    filterAndResetGallery();
  });
  els.filterGender.addEventListener('change', (e) => {
    state.filters.gender = e.target.value;
    filterAndResetGallery();
  });
  els.searchId.addEventListener('input', (e) => {
    state.filters.searchId = e.target.value;
    filterAndResetGallery();
  });

  els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.tabBtns.forEach(b => b.classList.remove('active'));
      els.tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  els.addProductForm.addEventListener('submit', handleUploadProduct);
  els.productImageInput.addEventListener('change', handleFileSelect);
  els.aiEditBtn.addEventListener('click', handleAiEdit);
  els.compressBtn.addEventListener('click', handleCompress);

  els.addSizeBtn.addEventListener('click', addSize);
  els.addGenderBtn.addEventListener('click', addGender);
  els.updateTrackerBtn.addEventListener('click', updateTracker);
  
  // Save API Key on change
  els.aiApiKeyInput.addEventListener('change', (e) => {
      localStorage.setItem('mirza_ai_key', e.target.value);
      showNotification('کلید API ذخیره شد');
  });
});
