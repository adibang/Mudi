document.addEventListener('DOMContentLoaded', initCategories);

let categories = [];
let editingCategoryId = null;

const modal = document.getElementById('categoryModal');
const addBtn = document.getElementById('addCategoryBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelCategory');
const form = document.getElementById('categoryForm');
const nameInput = document.getElementById('categoryName');
const searchInput = document.getElementById('searchCategory');
const table = document.getElementById('categoryTable');

async function initCategories() {
    await loadCategories();
    setupEvents();
}

async function loadCategories() {
    categories = await getCategories();
    renderTable();
}

function renderTable() {
    const search = searchInput.value.toLowerCase();
    const filtered = categories.filter(c => c.name.toLowerCase().includes(search));
    if (filtered.length === 0) {
        table.innerHTML = '<p>Tidak ada kategori.</p>';
        return;
    }
    let html = '<table><thead><tr><th>Nama</th><th>Aksi</th></tr></thead><tbody>';
    filtered.forEach(c => {
        html += `<tr>
            <td>${c.name}</td>
            <td class="action-buttons">
                <button class="btn-edit" data-id="${c._id}">Edit</button>
                <button class="btn-delete" data-id="${c._id}">Hapus</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    table.innerHTML = html;
    attachActions();
}

function attachActions() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editCategory(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
}

function setupEvents() {
    addBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    cancelBtn.addEventListener('click', () => modal.style.display = 'none');
    form.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', debounce(loadCategories, 300));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

function openAddModal() {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'Tambah Kategori';
    nameInput.value = '';
    modal.style.display = 'block';
}

function editCategory(id) {
    editingCategoryId = id;
    const category = categories.find(c => c._id === id);
    document.getElementById('categoryModalTitle').textContent = 'Edit Kategori';
    nameInput.value = category.name;
    modal.style.display = 'block';
}

async function handleSubmit(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return alert('Nama harus diisi');
    try {
        if (editingCategoryId) {
            await updateCategory(editingCategoryId, name);
        } else {
            await createCategory(name);
        }
        modal.style.display = 'none';
        loadCategories();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteCategory(id) {
    if (confirm('Yakin ingin menghapus kategori?')) {
        try {
            await deleteCategory(id);
            loadCategories();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}
