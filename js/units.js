document.addEventListener('DOMContentLoaded', initUnits);

let units = [];
let editingUnitId = null;

const modal = document.getElementById('unitModal');
const addBtn = document.getElementById('addUnitBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelUnit');
const form = document.getElementById('unitForm');
const nameInput = document.getElementById('unitName');
const searchInput = document.getElementById('searchUnit');
const table = document.getElementById('unitTable');

// Fungsi debounce sederhana (bisa juga diletakkan di file terpisah)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function initUnits() {
    await loadUnits();
    setupEvents();
}

async function loadUnits() {
    units = await getUnits(); // perbaiki: gunakan units, bukan categories
    renderTable();
}

function renderTable() {
    const search = searchInput.value.toLowerCase();
    const filtered = units.filter(u => u.name.toLowerCase().includes(search));
    if (filtered.length === 0) {
        table.innerHTML = '<p>Tidak ada satuan.</p>';
        return;
    }
    let html = '<table><thead><tr><th>Nama</th><th>Aksi</th></tr></thead><tbody>';
    filtered.forEach(u => {
        html += `<tr>
            <td>${u.name}</td>
            <td class="action-buttons">
                <button class="btn-edit" data-id="${u._id}">Edit</button>
                <button class="btn-delete" data-id="${u._id}">Hapus</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    table.innerHTML = html;
    attachActions();
}

function attachActions() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editUnit(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteUnit(btn.dataset.id));
    });
}

function setupEvents() {
    addBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    cancelBtn.addEventListener('click', () => modal.style.display = 'none');
    form.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', debounce(loadUnits, 300)); // perbaiki: loadUnits
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

function openAddModal() {
    editingUnitId = null;
    document.getElementById('unitModalTitle').textContent = 'Tambah Satuan';
    nameInput.value = '';
    modal.style.display = 'block';
}

function editUnit(id) {
    editingUnitId = id;
    const unit = units.find(u => u._id === id);
    if (!unit) return;
    document.getElementById('unitModalTitle').textContent = 'Edit Satuan';
    nameInput.value = unit.name;
    modal.style.display = 'block';
}

async function handleSubmit(e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return alert('Nama harus diisi');
    try {
        if (editingUnitId) {
            await updateUnit(editingUnitId, name);
        } else {
            await createUnit(name);
        }
        modal.style.display = 'none';
        loadUnits();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteUnit(id) {
    if (confirm('Yakin ingin menghapus satuan?')) {
        try {
            await deleteUnit(id);
            loadUnits();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}
