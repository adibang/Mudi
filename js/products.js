document.addEventListener('DOMContentLoaded', init);

let categories = [];
let units = [];
let products = [];
let editingProductId = null;
let conversions = []; // temporary for new product
let priceBreaks = [];

const modal = document.getElementById('productModal');
const conversionModal = document.getElementById('conversionModal');
const addBtn = document.getElementById('addProductBtn');
const closeBtns = document.querySelectorAll('.close');
const cancelBtn = document.getElementById('cancelBtn');
const productForm = document.getElementById('productForm');
const conversionForm = document.getElementById('conversionForm');
const cancelConversion = document.getElementById('cancelConversion');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

async function init() {
    await loadCategories();
    await loadUnits();
    await loadProducts();
    setupEventListeners();
}

async function loadCategories() {
    categories = await getCategories();
    populateCategoryFilter();
    populateCategorySelects();
}

async function loadUnits() {
    units = await getUnits();
    populateUnitSelects();
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat._id;
        option.textContent = cat.name;
        categoryFilter.appendChild(option);
    });
}

function populateCategorySelects() {
    // Isi select kategori di form produk
    const select = document.getElementById('productCategory') || createCategorySelect();
    select.innerHTML = '<option value="">Pilih Kategori</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat._id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

function populateUnitSelects() {
    // Untuk satuan utama
    const unitSelect = document.getElementById('productUnit');
    if (unitSelect) {
        unitSelect.innerHTML = '<option value="">Pilih Satuan</option>';
        units.forEach(u => {
            const option = document.createElement('option');
            option.value = u._id;
            option.textContent = u.name;
            unitSelect.appendChild(option);
        });
    }
    // Untuk modal konversi
    const convUnit = document.getElementById('convUnit');
    if (convUnit) {
        convUnit.innerHTML = '<option value="">Pilih Satuan</option>';
        units.forEach(u => {
            const option = document.createElement('option');
            option.value = u._id;
            option.textContent = u.name;
            convUnit.appendChild(option);
        });
    }
}

async function loadProducts() {
    const params = {};
    if (searchInput.value) params.search = searchInput.value;
    if (categoryFilter.value) params.category = categoryFilter.value;
    products = await getProducts(params);
    renderProductTable();
}

function renderProductTable() {
    const container = document.getElementById('productTable');
    if (products.length === 0) {
        container.innerHTML = '<p>Tidak ada produk.</p>';
        return;
    }
    let html = '<table><thead><tr><th>Nama</th><th>Kode</th><th>Kategori</th><th>Harga Jual</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>';
    products.forEach(p => {
        html += `<tr>
            <td>${p.name}</td>
            <td>${p.code || '-'}</td>
            <td>${p.category?.name || '-'}</td>
            <td>${p.price_sell || 0}</td>
            <td>${p.stock_initial || 0}</td>
            <td class="action-buttons">
                <button class="btn-edit" data-id="${p._id}">Edit</button>
                <button class="btn-delete" data-id="${p._id}">Hapus</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    // Attach event listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
}

function setupEventListeners() {
    addBtn.addEventListener('click', openAddModal);
    closeBtns.forEach(btn => btn.addEventListener('click', closeModals));
    cancelBtn.addEventListener('click', closeModals);
    cancelConversion.addEventListener('click', () => conversionModal.style.display = 'none');
    productForm.addEventListener('submit', handleProductSubmit);
    conversionForm.addEventListener('submit', handleConversionSubmit);
    searchInput.addEventListener('input', debounce(loadProducts, 500));
    categoryFilter.addEventListener('change', loadProducts);
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === conversionModal) conversionModal.style.display = 'none';
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function openAddModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Tambah Produk';
    resetProductForm();
    modal.style.display = 'block';
}

async function editProduct(id) {
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Edit Produk';
    const product = await getProduct(id);
    populateProductForm(product);
    modal.style.display = 'block';
}

function resetProductForm() {
    // Kosongkan semua field, set default
    conversions = [];
    priceBreaks = [];
    renderConversions();
    renderPriceBreaks();
    // Set value input ke kosong
    const form = document.getElementById('productForm');
    form.reset();
}

function populateProductForm(product) {
    // Isi form dengan data product
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productCode').value = product.code || '';
    document.getElementById('productIsWeighted').checked = product.isWeighted || false;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productCategory').value = product.category?._id || '';
    document.getElementById('productPriceBase').value = product.price_base || '';
    document.getElementById('productPriceSell').value = product.price_sell || '';
    document.getElementById('productDiscount').value = product.discount || '';
    document.getElementById('productWeight').value = product.weight || '';
    document.getElementById('productUnit').value = product.unit?._id || '';
    document.getElementById('productSku').value = product.sku || '';
    document.getElementById('productStockInitial').value = product.stock_initial || '';
    document.getElementById('productStockMin').value = product.stock_min || '';
    document.getElementById('productRack').value = product.rack_location || '';
    conversions = product.conversions || [];
    priceBreaks = product.price_breaks || [];
    renderConversions();
    renderPriceBreaks();
}

function renderConversions() {
    const container = document.getElementById('conversionsList');
    if (!container) return;
    if (conversions.length === 0) {
        container.innerHTML = '<p>Belum ada konversi.</p>';
    } else {
        let html = '<ul>';
        conversions.forEach((conv, index) => {
            const unitName = units.find(u => u._id === conv.unit)?.name || conv.unit;
            html += `<li>${unitName} (${conv.value}) - Barcode: ${conv.barcode || '-'} 
                <button type="button" onclick="removeConversion(${index})">Hapus</button></li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
}

function renderPriceBreaks() {
    const container = document.getElementById('priceBreaksList');
    if (!container) return;
    if (priceBreaks.length === 0) {
        container.innerHTML = '<p>Belum ada level harga.</p>';
    } else {
        let html = '<ul>';
        priceBreaks.forEach((pb, index) => {
            html += `<li>Min ${pb.min_qty} = ${pb.price} 
                <button type="button" onclick="removePriceBreak(${index})">Hapus</button></li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    }
}

// Fungsi global untuk diakses dari onclick inline
window.removeConversion = function(index) {
    conversions.splice(index, 1);
    renderConversions();
};
window.removePriceBreak = function(index) {
    priceBreaks.splice(index, 1);
    renderPriceBreaks();
};

function handleConversionSubmit(e) {
    e.preventDefault();
    const newConv = {
        unit: document.getElementById('convUnit').value,
        value: parseFloat(document.getElementById('convValue').value),
        barcode: document.getElementById('convBarcode').value || undefined,
        sku: document.getElementById('convSku').value || undefined,
        price_base: parseFloat(document.getElementById('convPriceBase').value) || undefined,
        price_sell: parseFloat(document.getElementById('convPriceSell').value) || undefined,
        points_customer: parseInt(document.getElementById('convPointsCustomer').value) || undefined,
        points_sales: parseInt(document.getElementById('convPointsSales').value) || undefined,
    };
    conversions.push(newConv);
    renderConversions();
    conversionModal.style.display = 'none';
    conversionForm.reset();
}

function handleProductSubmit(e) {
    e.preventDefault();
    // Kumpulkan data dari form
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        code: formData.get('code') || undefined,
        isWeighted: formData.get('isWeighted') === 'on',
        barcode: formData.get('barcode') || undefined,
        category: formData.get('category'),
        price_base: parseFloat(formData.get('price_base')) || undefined,
        price_sell: parseFloat(formData.get('price_sell')) || undefined,
        discount: parseFloat(formData.get('discount')) || undefined,
        weight: parseFloat(formData.get('weight')) || undefined,
        unit: formData.get('unit'),
        sku: formData.get('sku') || undefined,
        stock_initial: parseInt(formData.get('stock_initial')) || 0,
        stock_min: parseInt(formData.get('stock_min')) || 0,
        rack_location: formData.get('rack') || undefined,
        conversions: conversions,
        price_breaks: priceBreaks,
    };
    // Hapus properti undefined untuk menghindari error
    Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

    if (editingProductId) {
        updateProduct(editingProductId, productData).then(() => {
            closeModals();
            loadProducts();
        }).catch(err => alert('Error: ' + err.message));
    } else {
        createProduct(productData).then(() => {
            closeModals();
            loadProducts();
        }).catch(err => alert('Error: ' + err.message));
    }
}

function closeModals() {
    modal.style.display = 'none';
    conversionModal.style.display = 'none';
}

async function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

// Tambahkan tombol "Tambah Konversi" dan "Tambah Level Harga" di form produk secara dinamis
// Kita perlu membuat form fields di HTML atau di JS. Untuk kemudahan, kita buat di HTML tersembunyi atau kita inject via JS.
// Saya sarankan untuk menambahkan div placeholder di modal, lalu di js/products.js kita buat fungsi generateFormFields.
// Namun untuk menjaga agar jawaban tidak terlalu panjang, saya asumsikan kita sudah membuat field-field di HTML dengan id yang sesuai.
// Tapi karena kita belum menuliskan seluruh form HTML, kita perlu menyertakan kode untuk membuat form dinamis.

// Mari kita tambahkan fungsi untuk membangun form fields di modal produk.
// Di dalam modal, kita punya div dengan id="formFields". Kita isi di js.

function buildProductFormFields() {
    const container = document.getElementById('formFields');
    container.innerHTML = `
        <div class="form-group">
            <label>Nama Produk *</label>
            <input type="text" name="name" id="productName" required>
        </div>
        <div class="form-group">
            <label>Kode Produk (untuk timbangan)</label>
            <input type="text" name="code" id="productCode">
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" name="isWeighted" id="productIsWeighted"> Produk Timbangan
            </label>
        </div>
        <div class="form-group">
            <label>Barcode (reguler)</label>
            <input type="text" name="barcode" id="productBarcode">
        </div>
        <div class="form-group">
            <label>Kategori *</label>
            <select name="category" id="productCategory" required></select>
        </div>
        <div class="form-group">
            <label>Harga Dasar</label>
            <input type="number" name="price_base" id="productPriceBase" step="0.01">
        </div>
        <div class="form-group">
            <label>Harga Jual</label>
            <input type="number" name="price_sell" id="productPriceSell" step="0.01">
        </div>
        <div class="form-group">
            <label>Diskon</label>
            <input type="number" name="discount" id="productDiscount" step="0.01">
        </div>
        <div class="form-group">
            <label>Berat</label>
            <input type="number" name="weight" id="productWeight" step="0.01">
        </div>
        <div class="form-group">
            <label>Satuan *</label>
            <select name="unit" id="productUnit" required></select>
        </div>
        <div class="form-group">
            <label>SKU</label>
            <input type="text" name="sku" id="productSku">
        </div>
        <div class="form-group">
            <label>Stok Awal</label>
            <input type="number" name="stock_initial" id="productStockInitial">
        </div>
        <div class="form-group">
            <label>Stok Minimal</label>
            <input type="number" name="stock_min" id="productStockMin">
        </div>
        <div class="form-group">
            <label>Letak Rak</label>
            <input type="text" name="rack" id="productRack">
        </div>
        <div class="form-group">
            <label>Konversi Satuan</label>
            <button type="button" id="addConversionBtn" class="btn-secondary">Tambah Konversi</button>
            <div id="conversionsList"></div>
        </div>
        <div class="form-group">
            <label>Level Harga (Qty Break)</label>
            <button type="button" id="addPriceBreakBtn" class="btn-secondary">Tambah Level Harga</button>
            <div id="priceBreaksList"></div>
        </div>
    `;
    // Attach events untuk tombol tambah
    document.getElementById('addConversionBtn').addEventListener('click', () => {
        // Isi select satuan di modal konversi dengan units terbaru
        populateUnitSelects(); // refresh
        conversionModal.style.display = 'block';
    });
    document.getElementById('addPriceBreakBtn').addEventListener('click', () => {
        const minQty = prompt('Minimal Qty:');
        if (!minQty) return;
        const price = prompt('Harga Jual:');
        if (!price) return;
        priceBreaks.push({ min_qty: parseInt(minQty), price: parseFloat(price) });
        renderPriceBreaks();
    });
}

// Panggil buildProductFormFields setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    buildProductFormFields();
    init();
});
