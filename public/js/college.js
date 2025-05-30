// College Page Management
class CollegeManager {
    constructor() {
        this.colleges = [];
        this.filteredColleges = [];
        this.selectedColleges = [];
        this.currentCollege = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadColleges();
    }
    
    initializeElements() {
        this.collegeListEl = document.getElementById('college-list');
        this.filterDrawerEl = document.getElementById('filter-drawer');
        this.filterToggleBtn = document.getElementById('filter-toggle');
        this.closeFilterBtn = document.getElementById('close-filter');
        this.notesModal = document.getElementById('notes-modal');
        this.notesCollegeName = document.getElementById('notes-college-name');
        this.notesContent = document.getElementById('notes-content');
        this.closeNotesBtn = document.getElementById('close-notes');
        this.saveNotesBtn = document.getElementById('save-notes');
        this.sortSelect = document.getElementById('sort');
        this.filterSelect = document.getElementById('filter-select');
        this.locationFilter = document.getElementById('location-filter');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        this.resetFiltersBtn = document.getElementById('reset-filters');
    }
    
    initializeEventListeners() {
        this.filterToggleBtn?.addEventListener('click', () => this.toggleFilterDrawer());
        this.closeFilterBtn?.addEventListener('click', () => this.toggleFilterDrawer());
        this.closeNotesBtn?.addEventListener('click', () => this.closeNotesModal());
        this.saveNotesBtn?.addEventListener('click', () => this.saveNotes());
        this.sortSelect?.addEventListener('change', () => this.handleSort());
        this.applyFiltersBtn?.addEventListener('click', () => this.applyFilters());
        this.resetFiltersBtn?.addEventListener('click', () => this.resetFilters());
        
        // Close modal when clicking outside
        this.notesModal?.addEventListener('click', (e) => {
            if (e.target === this.notesModal) {
                this.closeNotesModal();
            }
        });
    }
    
    async loadColleges() {
        try {
            const response = await fetch('/api/colleges');
            if (!response.ok) {
                throw new Error('Failed to load colleges');
            }
            
            this.colleges = await response.json();
            this.filteredColleges = [...this.colleges];
            this.renderColleges();
            
        } catch (error) {
            console.error('Error loading colleges:', error);
            this.showError('Failed to load colleges. Please refresh the page.');
        }
    }
    
    renderColleges() {
        if (!this.collegeListEl) return;
        
        this.collegeListEl.innerHTML = '';
        
        if (this.filteredColleges.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.filteredColleges.forEach(college => {
            const collegeCard = this.createCollegeCard(college);
            this.collegeListEl.appendChild(collegeCard);
        });
    }
    
    createCollegeCard(college) {
        const card = document.createElement('div');
        card.className = 'college-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        
        card.innerHTML = `
            <div class="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
                <div class="absolute top-3 left-3">
                    <div class="rank-badge bg-white text-indigo-700 shadow-md w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        ${college.ranking}
                    </div>
                </div>
                <div class="absolute top-3 right-3">
                    <button class="compare-btn p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" 
                            data-id="${college.id}" title="Add to comparison">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-lg text-gray-800 line-clamp-2">${college.name}</h3>
                </div>
                <div class="flex items-center text-sm text-gray-600 mb-3">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ${college.location}
                    <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        college.type === 'Private' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }">
                        ${college.type}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-4 line-clamp-2">${college.description}</p>
                <div class="grid grid-cols-2 gap-2 mb-4">
                    <div class="bg-gray-50 p-2 rounded">
                        <div class="text-xs text-gray-500">Tuition</div>
                        <div class="font-medium">$${college.tuition.toLocaleString()}</div>
                    </div>
                    <div class="bg-gray-50 p-2 rounded">
                        <div class="text-xs text-gray-500">Acceptance</div>
                        <div class="font-medium">${college.acceptanceRate}%</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="notes-btn flex-grow py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors" 
                            data-id="${college.id}">
                        <svg class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                    </button>
                    <button class="visit-btn py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            data-website="${college.website}">
                        Visit
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.addCardEventListeners(card, college);
        
        return card;
    }
    
    addCardEventListeners(card, college) {
        // Notes button
        const notesBtn = card.querySelector('.notes-btn');
        notesBtn.addEventListener('click', () => this.openNotesModal(college));
        
        // Compare button
        const compareBtn = card.querySelector('.compare-btn');
        compareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCompare(college);
        });
        
        // Visit button
        const visitBtn = card.querySelector('.visit-btn');
        visitBtn.addEventListener('click', () => {
            if (college.website) {
                window.open(college.website, '_blank');
            }
        });
    }
    
    async openNotesModal(college) {
        this.currentCollege = college;
        this.notesCollegeName.textContent = college.name;
        
        try {
            // Load existing notes
            const response = await fetch(`/api/colleges/${college.id}/notes`);
            if (response.ok) {
                const data = await response.json();
                this.notesContent.value = data.notes || '';
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        }
        
        this.notesModal.classList.remove('hidden');
        this.notesContent.focus();
    }
    
    closeNotesModal() {
        this.notesModal.classList.add('hidden');
        this.currentCollege = null;
    }
    
    async saveNotes() {
        if (!this.currentCollege) return;
        
        const notes = this.notesContent.value;
        
        try {
            const response = await fetch(`/api/colleges/${this.currentCollege.id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes })
            });
            
            if (response.ok) {
                this.showSuccess('Notes saved successfully!');
                this.closeNotesModal();
            } else {
                throw new Error('Failed to save notes');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showError('Failed to save notes. Please try again.');
        }
    }
    
    toggleFilterDrawer() {
        const isOpen = this.filterDrawerEl.classList.contains('translate-x-0');
        
        if (isOpen) {
            this.filterDrawerEl.classList.remove('translate-x-0');
            this.filterDrawerEl.classList.add('translate-x-full');
        } else {
            this.filterDrawerEl.classList.remove('translate-x-full');
            this.filterDrawerEl.classList.add('translate-x-0');
        }
    }
    
    handleSort() {
        const sortBy = this.sortSelect.value;
        
        this.filteredColleges.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'acceptance':
                    return a.acceptanceRate - b.acceptanceRate;
                case 'tuition':
                    return a.tuition - b.tuition;
                case 'rank':
                default:
                    return a.ranking - b.ranking;
            }
        });
        
        this.renderColleges();
    }
    
    applyFilters() {
        let filtered = [...this.colleges];
        
        // Location filter
        const location = this.locationFilter?.value;
        if (location) {
            filtered = filtered.filter(college => 
                college.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        
        // Type filter
        const typeCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedTypes = Array.from(typeCheckboxes).map(cb => cb.value);
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(college => 
                selectedTypes.includes(college.type.toLowerCase())
            );
        }
        
        // Tuition filter
        const tuitionRange = document.getElementById('tuition-range');
        if (tuitionRange) {
            const maxTuition = parseInt(tuitionRange.value);
            filtered = filtered.filter(college => college.tuition <= maxTuition);
        }
        
        // Acceptance rate filter
        const acceptanceRange = document.getElementById('acceptance-range');
        if (acceptanceRange) {
            const maxAcceptance = parseInt(acceptanceRange.value);
            filtered = filtered.filter(college => college.acceptanceRate <= maxAcceptance);
        }
        
        this.filteredColleges = filtered;
        this.renderColleges();
        this.toggleFilterDrawer();
    }
    
    resetFilters() {
        // Reset form elements
        if (this.locationFilter) this.locationFilter.value = '';
        
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        const ranges = document.querySelectorAll('input[type="range"]');
        ranges.forEach(range => {
            range.value = range.max;
            const valueDisplay = document.getElementById(range.id.replace('-range', '-value'));
            if (valueDisplay) {
                valueDisplay.textContent = this.formatRangeValue(range.id, range.value);
            }
        });
        
        // Reset filtered colleges
        this.filteredColleges = [...this.colleges];
        this.renderColleges();
    }
    
    formatRangeValue(rangeId, value) {
        if (rangeId.includes('tuition')) {
            return `$${parseInt(value).toLocaleString()}`;
        } else if (rangeId.includes('acceptance')) {
            return `${value}%`;
        }
        return value;
    }
    
    toggleCompare(college) {
        const index = this.selectedColleges.findIndex(c => c.id === college.id);
        
        if (index === -1) {
            if (this.selectedColleges.length < 3) {
                this.selectedColleges.push(college);
                this.showSuccess(`${college.name} added to comparison`);
            } else {
                this.showError('You can compare up to 3 colleges at a time');
                return;
            }
        } else {
            this.selectedColleges.splice(index, 1);
            this.showSuccess(`${college.name} removed from comparison`);
        }
        
        this.updateCompareList();
    }
    
    updateCompareList() {
        const compareList = document.getElementById('compare-list');
        if (!compareList) return;
        
        compareList.innerHTML = '';
        
        if (this.selectedColleges.length === 0) {
            compareList.innerHTML = '<p class="text-gray-500 text-sm">Select colleges to compare</p>';
            return;
        }
        
        this.selectedColleges.forEach(college => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center bg-gray-50 p-2 rounded';
            item.innerHTML = `
                <span class="text-sm">${college.name}</span>
                <button class="remove-compare text-gray-400 hover:text-gray-600" data-id="${college.id}">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;
            compareList.appendChild(item);
            
            const removeBtn = item.querySelector('.remove-compare');
            removeBtn.addEventListener('click', () => {
                const index = this.selectedColleges.findIndex(c => c.id === college.id);
                if (index !== -1) {
                    this.selectedColleges.splice(index, 1);
                    this.updateCompareList();
                }
            });
        });
        
        if (this.selectedColleges.length >= 2) {
            const compareBtn = document.createElement('button');
            compareBtn.className = 'w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded text-sm';
            compareBtn.textContent = 'Compare Selected';
            compareBtn.addEventListener('click', () => this.showComparison());
            compareList.appendChild(compareBtn);
        }
    }
    
    showComparison() {
        // Create comparison modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const content = document.createElement('div');
        content.className = 'bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto';
        
        content.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">College Comparison</h2>
                    <button class="close-comparison text-gray-500 hover:text-gray-700">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2 px-4">Criteria</th>
                                ${this.selectedColleges.map(college => 
                                    `<th class="text-left py-2 px-4">${college.name}</th>`
                                ).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${this.createComparisonRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = content.querySelector('.close-comparison');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    createComparisonRows() {
        const criteria = [
            { label: 'Ranking', key: 'ranking' },
            { label: 'Location', key: 'location' },
            { label: 'Type', key: 'type' },
            { label: 'Tuition', key: 'tuition', format: (val) => `${val.toLocaleString()}` },
            { label: 'Acceptance Rate', key: 'acceptanceRate', format: (val) => `${val}%` },
            { label: 'Description', key: 'description' }
        ];
        
        return criteria.map(criterion => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-900">${criterion.label}</td>
                ${this.selectedColleges.map(college => {
                    const value = college[criterion.key];
                    const displayValue = criterion.format ? criterion.format(value) : value;
                    return `<td class="py-3 px-4 text-gray-700">${displayValue}</td>`;
                }).join('')}
            </tr>
        `).join('');
    }
    
    showEmptyState() {
        this.collegeListEl.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12">
                <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No colleges found</h3>
                <p class="text-gray-500 text-center">Try adjusting your filters to see more results.</p>
                <button class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" 
                        onclick="window.collegeManager.resetFilters()">
                    Reset Filters
                </button>
            </div>
        `;
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.college-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `college-alert fixed top-4 right-4 p-4 rounded-lg shadow-lg z-40 ${
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 
            'bg-green-100 border border-green-400 text-green-700'
        }`;
        alert.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${type === 'error' ? 
                        '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>' :
                        '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
                    }
                </div>
                <div class="ml-3">
                    <p class="text-sm">${message}</p>
                </div>
                <button class="ml-auto pl-3" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 3000);
    }
}

// Range slider functionality
class RangeSliderManager {
    constructor() {
        this.initializeRangeSliders();
    }
    
    initializeRangeSliders() {
        const ranges = document.querySelectorAll('input[type="range"]');
        ranges.forEach(range => {
            this.updateRangeValue(range);
            range.addEventListener('input', () => this.updateRangeValue(range));
        });
    }
    
    updateRangeValue(range) {
        const valueDisplay = document.getElementById(range.id.replace('-range', '-value'));
        if (valueDisplay) {
            if (range.id.includes('tuition')) {
                valueDisplay.textContent = `${parseInt(range.value).toLocaleString()}`;
            } else if (range.id.includes('acceptance')) {
                valueDisplay.textContent = `${range.value}%`;
            }
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.collegeManager = new CollegeManager();
    new RangeSliderManager();
});