// GRC Tracker JavaScript Application
class GRCTracker {
    constructor() {
        this.currentSection = 'dashboard';
        this.grcItems = [];
        this.evidence = [];
        this.dashboardStats = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Modal controls
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.dataset.modal);
            });
        });

        // Add item button
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.openAddItemModal();
        });

        // Add evidence button
        document.getElementById('add-evidence-btn').addEventListener('click', () => {
            this.openAddEvidenceModal();
        });

        // Form submissions
        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleItemSubmit();
        });

        document.getElementById('evidence-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEvidenceSubmit();
        });

        // Search and filters
        document.getElementById('search-items').addEventListener('input', (e) => {
            this.filterItems(e.target.value);
        });

        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filterItems();
        });

        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.filterItems();
        });

        document.getElementById('search-evidence').addEventListener('input', (e) => {
            this.filterEvidence(e.target.value);
        });

        document.getElementById('filter-evidence-type').addEventListener('change', (e) => {
            this.filterEvidence();
        });

        // Modal outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadGRCItems(),
                this.loadEvidence(),
                this.loadDashboardStats()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading data', 'error');
        }
    }

    async loadGRCItems() {
        try {
            const response = await fetch('/api/grc-items');
            this.grcItems = await response.json();
            this.renderGRCItems();
        } catch (error) {
            console.error('Error loading GRC items:', error);
        }
    }

    async loadEvidence() {
        try {
            const response = await fetch('/api/evidence');
            this.evidence = await response.json();
            this.renderEvidence();
        } catch (error) {
            console.error('Error loading evidence:', error);
        }
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('/api/dashboard');
            this.dashboardStats = await response.json();
            this.renderDashboard();
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Refresh data for the current section
        if (sectionName === 'dashboard') {
            this.loadDashboardStats();
        } else if (sectionName === 'grc-items') {
            this.loadGRCItems();
        } else if (sectionName === 'evidence') {
            this.loadEvidence();
        }
    }

    renderDashboard() {
        const stats = this.dashboardStats;
        
        // Update stat cards
        document.getElementById('total-items').textContent = stats.totalItems || 0;
        document.getElementById('total-evidence').textContent = stats.totalEvidence || 0;
        document.getElementById('completed-items').textContent = stats.itemsByStatus?.Completed || 0;
        document.getElementById('pending-items').textContent = 
            (stats.itemsByStatus?.['Not Started'] || 0) + 
            (stats.itemsByStatus?.['In Progress'] || 0);

        // Render status chart
        this.renderChart('status-chart', stats.itemsByStatus || {});
        
        // Render framework chart
        this.renderChart('framework-chart', stats.itemsByFramework || {});

        // Render recent items
        this.renderRecentItems(stats.recentItems || []);
    }

    renderChart(elementId, data) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        if (Object.keys(data).length === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }

        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        
        Object.entries(data).forEach(([label, value]) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            
            const barElement = document.createElement('div');
            barElement.className = 'chart-bar';
            barElement.innerHTML = `
                <span class="chart-label">${label}</span>
                <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                <span class="chart-value">${value}</span>
            `;
            
            container.appendChild(barElement);
        });
    }

    renderRecentItems(items) {
        const container = document.getElementById('recent-items-list');
        
        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent items</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card priority-${item.priority.toLowerCase()}">
                <div class="item-header">
                    <div>
                        <div class="item-title">${this.escapeHtml(item.title)}</div>
                        <div class="item-meta">
                            <span><i class="fas fa-tag"></i> ${item.category}</span>
                            <span class="status-badge status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                            ${item.framework ? `<span><i class="fas fa-shield-alt"></i> ${item.framework}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${item.description ? `<div class="item-description">${this.escapeHtml(item.description.substring(0, 150))}${item.description.length > 150 ? '...' : ''}</div>` : ''}
            </div>
        `).join('');
    }

    renderGRCItems() {
        const container = document.getElementById('grc-items-list');
        
        if (this.grcItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No GRC Items</h3>
                    <p>Start by adding your first GRC item to track compliance requirements, controls, and audits.</p>
                    <button class="btn btn-primary" onclick="app.openAddItemModal()">
                        <i class="fas fa-plus"></i> Add First Item
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.grcItems.map(item => `
            <div class="item-card priority-${item.priority.toLowerCase()}" data-id="${item.id}">
                <div class="item-header">
                    <div>
                        <div class="item-title">${this.escapeHtml(item.title)}</div>
                        <div class="item-meta">
                            <span><i class="fas fa-tag"></i> ${item.category}</span>
                            <span class="status-badge status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                            <span><i class="fas fa-flag"></i> ${item.priority}</span>
                            ${item.framework ? `<span><i class="fas fa-shield-alt"></i> ${item.framework}</span>` : ''}
                            ${item.assignedTo ? `<span><i class="fas fa-user"></i> ${this.escapeHtml(item.assignedTo)}</span>` : ''}
                            ${item.dueDate ? `<span><i class="fas fa-calendar"></i> ${this.formatDate(item.dueDate)}</span>` : ''}
                            <span><i class="fas fa-paperclip"></i> ${item.evidenceIds.length} evidence</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.openItemDetails('${item.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.editItem('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteItem('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                ${item.description ? `<div class="item-description">${this.escapeHtml(item.description.substring(0, 200))}${item.description.length > 200 ? '...' : ''}</div>` : ''}
            </div>
        `).join('');
    }

    renderEvidence() {
        const container = document.getElementById('evidence-list');
        
        if (this.evidence.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Evidence</h3>
                    <p>Upload files, add URLs, or create notes as evidence for your GRC items.</p>
                    <button class="btn btn-primary" onclick="app.openAddEvidenceModal()">
                        <i class="fas fa-upload"></i> Upload First Evidence
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.evidence.map(evidence => {
            const grcItem = this.grcItems.find(item => item.id === evidence.grcItemId);
            return `
                <div class="evidence-card" data-id="${evidence.id}">
                    <div class="evidence-header">
                        <div>
                            <div class="evidence-title">${this.escapeHtml(evidence.title)}</div>
                            <div class="item-meta">
                                <span class="evidence-type">${evidence.type}</span>
                                ${grcItem ? `<span><i class="fas fa-link"></i> ${this.escapeHtml(grcItem.title)}</span>` : ''}
                                <span><i class="fas fa-clock"></i> ${this.formatDate(evidence.createdAt, true)}</span>
                            </div>
                        </div>
                        <div class="item-actions">
                            ${evidence.type === 'file' && evidence.filePath ? 
                                `<button class="btn btn-sm btn-secondary" onclick="window.open('${evidence.filePath}', '_blank')">
                                    <i class="fas fa-download"></i> Download
                                </button>` : ''}
                            ${evidence.type === 'url' && evidence.url ? 
                                `<button class="btn btn-sm btn-secondary" onclick="window.open('${evidence.url}', '_blank')">
                                    <i class="fas fa-external-link-alt"></i> Open
                                </button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="app.deleteEvidence('${evidence.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    ${evidence.description ? `<div class="item-description">${this.escapeHtml(evidence.description)}</div>` : ''}
                    ${evidence.type === 'file' && evidence.fileName ? 
                        `<div class="evidence-file-info">
                            <div><strong>File:</strong> ${this.escapeHtml(evidence.originalName)}</div>
                            <div><strong>Size:</strong> ${this.formatFileSize(evidence.fileSize)}</div>
                            <div><strong>Type:</strong> ${evidence.mimeType}</div>
                        </div>` : ''}
                    ${evidence.type === 'url' && evidence.url ? 
                        `<div class="evidence-file-info">
                            <div><strong>URL:</strong> <a href="${evidence.url}" target="_blank">${this.escapeHtml(evidence.url)}</a></div>
                        </div>` : ''}
                    ${evidence.notes ? `<div class="mt-2"><strong>Notes:</strong> ${this.escapeHtml(evidence.notes)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    openAddItemModal() {
        document.getElementById('item-modal-title').textContent = 'Add GRC Item';
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-modal').classList.add('active');
    }

    openAddEvidenceModal() {
        // Populate GRC items dropdown
        const select = document.getElementById('evidence-grc-item');
        select.innerHTML = '<option value="">Select GRC Item</option>' + 
            this.grcItems.map(item => `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`).join('');
        
        document.getElementById('evidence-form').reset();
        toggleEvidenceFields(); // Show appropriate fields based on type
        document.getElementById('evidence-modal').classList.add('active');
    }

    async editItem(id) {
        const item = this.grcItems.find(i => i.id === id);
        if (!item) return;

        document.getElementById('item-modal-title').textContent = 'Edit GRC Item';
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-title').value = item.title;
        document.getElementById('item-description').value = item.description || '';
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-framework').value = item.framework || '';
        document.getElementById('item-status').value = item.status;
        document.getElementById('item-priority').value = item.priority;
        document.getElementById('item-assigned-to').value = item.assignedTo || '';
        document.getElementById('item-due-date').value = item.dueDate || '';
        
        document.getElementById('item-modal').classList.add('active');
    }

    async openItemDetails(id) {
        const item = this.grcItems.find(i => i.id === id);
        if (!item) return;

        const itemEvidence = this.evidence.filter(e => e.grcItemId === id);
        
        const content = `
            <div style="padding: 1.5rem;">
                <div class="item-meta mb-3">
                    <span class="status-badge status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                    <span><i class="fas fa-tag"></i> ${item.category}</span>
                    <span><i class="fas fa-flag"></i> ${item.priority}</span>
                    ${item.framework ? `<span><i class="fas fa-shield-alt"></i> ${item.framework}</span>` : ''}
                </div>
                
                ${item.description ? `<div class="mb-3"><strong>Description:</strong><br>${this.escapeHtml(item.description)}</div>` : ''}
                
                <div class="mb-3">
                    <div><strong>Created:</strong> ${this.formatDate(item.createdAt, true)}</div>
                    <div><strong>Last Updated:</strong> ${this.formatDate(item.updatedAt, true)}</div>
                    ${item.assignedTo ? `<div><strong>Assigned To:</strong> ${this.escapeHtml(item.assignedTo)}</div>` : ''}
                    ${item.dueDate ? `<div><strong>Due Date:</strong> ${this.formatDate(item.dueDate)}</div>` : ''}
                </div>

                <h4>Evidence (${itemEvidence.length})</h4>
                ${itemEvidence.length > 0 ? 
                    itemEvidence.map(evidence => `
                        <div class="evidence-card mb-2">
                            <div class="evidence-title">${this.escapeHtml(evidence.title)}</div>
                            <div class="item-meta">
                                <span class="evidence-type">${evidence.type}</span>
                                <span>${this.formatDate(evidence.createdAt, true)}</span>
                            </div>
                            ${evidence.description ? `<div class="mt-1">${this.escapeHtml(evidence.description)}</div>` : ''}
                        </div>
                    `).join('') : '<p class="text-muted">No evidence attached</p>'
                }
            </div>
        `;

        document.getElementById('item-details-title').textContent = item.title;
        document.getElementById('item-details-content').innerHTML = content;
        document.getElementById('item-details-modal').classList.add('active');
    }

    async handleItemSubmit() {
        const formData = {
            title: document.getElementById('item-title').value,
            description: document.getElementById('item-description').value,
            category: document.getElementById('item-category').value,
            framework: document.getElementById('item-framework').value,
            status: document.getElementById('item-status').value,
            priority: document.getElementById('item-priority').value,
            assignedTo: document.getElementById('item-assigned-to').value,
            dueDate: document.getElementById('item-due-date').value
        };

        const itemId = document.getElementById('item-id').value;
        
        try {
            const url = itemId ? `/api/grc-items/${itemId}` : '/api/grc-items';
            const method = itemId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.closeModal('item-modal');
                await this.loadData();
                this.showNotification(itemId ? 'Item updated successfully' : 'Item created successfully', 'success');
            } else {
                throw new Error('Failed to save item');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            this.showNotification('Error saving item', 'error');
        }
    }

    async handleEvidenceSubmit() {
        const formData = new FormData();
        const evidenceType = document.getElementById('evidence-type').value;
        
        formData.append('grcItemId', document.getElementById('evidence-grc-item').value);
        formData.append('title', document.getElementById('evidence-title').value);
        formData.append('description', document.getElementById('evidence-description').value);
        formData.append('notes', document.getElementById('evidence-notes').value);
        formData.append('type', evidenceType);

        if (evidenceType === 'file') {
            const fileInput = document.getElementById('evidence-file');
            if (fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }
        } else if (evidenceType === 'url') {
            formData.append('url', document.getElementById('evidence-url').value);
        }

        try {
            const response = await fetch('/api/evidence', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.closeModal('evidence-modal');
                await this.loadData();
                this.showNotification('Evidence uploaded successfully', 'success');
            } else {
                throw new Error('Failed to upload evidence');
            }
        } catch (error) {
            console.error('Error uploading evidence:', error);
            this.showNotification('Error uploading evidence', 'error');
        }
    }

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item? This will also delete all associated evidence.')) {
            return;
        }

        try {
            const response = await fetch(`/api/grc-items/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadData();
                this.showNotification('Item deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Error deleting item', 'error');
        }
    }

    async deleteEvidence(id) {
        if (!confirm('Are you sure you want to delete this evidence?')) {
            return;
        }

        try {
            const response = await fetch(`/api/evidence/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadData();
                this.showNotification('Evidence deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete evidence');
            }
        } catch (error) {
            console.error('Error deleting evidence:', error);
            this.showNotification('Error deleting evidence', 'error');
        }
    }

    filterItems(searchTerm = '') {
        const statusFilter = document.getElementById('filter-status').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const searchInput = searchTerm || document.getElementById('search-items').value;
        
        const filteredItems = this.grcItems.filter(item => {
            const matchesSearch = !searchInput || 
                item.title.toLowerCase().includes(searchInput.toLowerCase()) ||
                item.description.toLowerCase().includes(searchInput.toLowerCase());
            
            const matchesStatus = !statusFilter || item.status === statusFilter;
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            
            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Temporarily replace grcItems for rendering
        const originalItems = this.grcItems;
        this.grcItems = filteredItems;
        this.renderGRCItems();
        this.grcItems = originalItems;
    }

    filterEvidence(searchTerm = '') {
        const typeFilter = document.getElementById('filter-evidence-type').value;
        const searchInput = searchTerm || document.getElementById('search-evidence').value;
        
        const filteredEvidence = this.evidence.filter(evidence => {
            const matchesSearch = !searchInput || 
                evidence.title.toLowerCase().includes(searchInput.toLowerCase()) ||
                evidence.description.toLowerCase().includes(searchInput.toLowerCase());
            
            const matchesType = !typeFilter || evidence.type === typeFilter;
            
            return matchesSearch && matchesType;
        });

        // Temporarily replace evidence for rendering
        const originalEvidence = this.evidence;
        this.evidence = filteredEvidence;
        this.renderEvidence();
        this.evidence = originalEvidence;
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showNotification(message, type = 'info') {
        // Simple notification system - could be enhanced with a toast library
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') notification.style.backgroundColor = '#38a169';
        else if (type === 'error') notification.style.backgroundColor = '#e53e3e';
        else notification.style.backgroundColor = '#3182ce';
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatDate(dateString, includeTime = false) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString('en-US', options);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Helper function for evidence type switching
function toggleEvidenceFields() {
    const type = document.getElementById('evidence-type').value;
    const fileGroup = document.getElementById('file-upload-group');
    const urlGroup = document.getElementById('url-input-group');
    
    if (type === 'file') {
        fileGroup.style.display = 'block';
        urlGroup.style.display = 'none';
        document.getElementById('evidence-file').required = true;
        document.getElementById('evidence-url').required = false;
    } else if (type === 'url') {
        fileGroup.style.display = 'none';
        urlGroup.style.display = 'block';
        document.getElementById('evidence-file').required = false;
        document.getElementById('evidence-url').required = true;
    } else {
        fileGroup.style.display = 'none';
        urlGroup.style.display = 'none';
        document.getElementById('evidence-file').required = false;
        document.getElementById('evidence-url').required = false;
    }
}

// Initialize the application
const app = new GRCTracker();