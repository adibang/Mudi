const API_BASE_URL = 'http://localhost:5000/api'; // Ganti dengan URL Railway nanti

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
}

// Categories
async function getCategories() {
    return apiRequest('/categories');
}
async function createCategory(name) {
    return apiRequest('/categories', 'POST', { name });
}
async function updateCategory(id, name) {
    return apiRequest(`/categories/${id}`, 'PUT', { name });
}
async function deleteCategory(id) {
    return apiRequest(`/categories/${id}`, 'DELETE');
}

// Units
async function getUnits() {
    return apiRequest('/units');
}
async function createUnit(name) {
    return apiRequest('/units', 'POST', { name });
}
async function updateUnit(id, name) {
    return apiRequest(`/units/${id}`, 'PUT', { name });
}
async function deleteUnit(id) {
    return apiRequest(`/units/${id}`, 'DELETE');
}

// Products
async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? '?'+query : ''}`);
}
async function getProduct(id) {
    return apiRequest(`/products/${id}`);
}
async function createProduct(data) {
    return apiRequest('/products', 'POST', data);
}
async function updateProduct(id, data) {
    return apiRequest(`/products/${id}`, 'PUT', data);
}
async function deleteProduct(id) {
    return apiRequest(`/products/${id}`, 'DELETE');
}
