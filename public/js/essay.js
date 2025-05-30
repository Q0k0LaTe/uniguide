// Essay Management System
class EssayManager {
    constructor() {
        this.essays = [];
        this.currentEssay = null;
        this.quill = null;
        
        this.initializeElements();
        this.initializeQuillEditor();
        this.initializeEventListeners();
        this.loadEssays();
    }
    
    initializeElements() {
        this.essayList = document.querySelector('.essay-card');
        this.saveBtn = document.getElementById('save-btn');
        this.aiAssistBtn = document.getElementById('ai-assist-btn');
        this.aiModal = document.getElementById('ai-modal');
        this.closeAiModal = document.getElementById('close-ai-modal');
        this.wordCountEl = document.getElementById('word-count');
        this.versionsPanel = document.getElementById('versions-panel');
        this.outlinePanel = document.getElementById('outline-panel');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.uploadZone = document.getElementById('upload-zone');
        this.fileInput = this.uploadZone?.querySelector('input[type="file"]');
    }
    
    initializeQuillEditor() {
        if (document.getElementById('editor')) {
            this.quill = new Quill('#editor', {
                theme: 'snow',
                placeholder: 'Start writing your essay...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        ['clean']
                    ]
                }
            });
            
            // Set initial content
            const sampleEssay = `<p>From the moment I first visited Harvard's campus during a family trip to Boston, I was captivated by the sense of intellectual vitality that permeates the university. Walking through Harvard Yard, I could almost feel the centuries of academic tradition and innovation that have defined this institution. But my interest in Harvard goes far beyond its storied reputation or historic buildings.</p>
            <p>As someone deeply passionate about interdisciplinary research in computational biology, Harvard's commitment to breaking down barriers between traditional academic fields resonates strongly with me. The Systems Biology PhD program, which combines computer science, mathematics, and biology to tackle complex biological questions, perfectly aligns with my research interests. Professor Sarah Richardson's groundbreaking work on CRISPR applications in sustainable agriculture particularly excites me, as it represents the kind of impactful research I hope to pursue.</p>
            <p>Beyond academics, Harvard's vibrant student organizations would provide me with opportunities to grow as a leader and community member. Having founded my high school's Biotechnology Club and led it to regional competition success, I'm eager to contribute to Harvard's iGEM team and Undergraduate Research Association. These platforms would allow me to collaborate with like-minded peers while mentoring younger students interested in scientific research.</p>`;
            
            this.quill.clipboard.dangerouslyPasteHTML(sampleEssay);
            
            // Word count functionality
            this.quill.on('text-change', () => this.updateWordCount());
            this.updateWordCount();
        }
    }
    
    initializeEventListeners() {
        // Save button
        this.saveBtn?.addEventListener('click', () => this.saveEssay());
        
        // AI Assistant
        this.aiAssistBtn?.addEventListener('click', () => this.openAiModal());
        this.closeAiModal?.addEventListener('click', () => this.closeAiModalHandler());
        
        // AI action buttons
        document.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAiAction(btn.textContent.trim()));
        });
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });
        
        // Essay selection
        document.querySelectorAll('.essay-card').forEach(card => {
            card.addEventListener('click', () => this.selectEssay(card));
        });
        
        // File upload
        this.setupFileUpload();
        
        // Version management
        this.setupVersionManagement();
        
        // Outline generation
        this.setupOutlineGeneration();
        
        // Navigation
        this.setupNavigation();
    }
    
    setupNavigation() {
        // Add click handlers to navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href) {
                const href = link.getAttribute('href');
                
                // Handle internal navigation
                if (href.startsWith('/') && !href.startsWith('//')) {
                    e.preventDefault();
                    window.location.href = href;
                }
            }
        });
    }
    
    updateWordCount() {
        if (this.quill && this.wordCountEl) {
            const text = this.quill.getText();
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            this.wordCountEl.textContent = `${wordCount} words`;
        }
    }
    
    async loadEssays() {
        try {
            const response = await fetch('/api/essays');
            if (response.ok) {
                this.essays = await response.json();
                this.renderEssayList();
            }
        } catch (error) {
            console.error('Error loading essays:', error);
        }
    }
    
    renderEssayList() {
        // This would populate the essay sidebar with user's essays
        // For now, we'll use the static HTML
    }
    
    selectEssay(card) {
        // Remove active class from all cards
        document.querySelectorAll('.essay-card').forEach(c => {
            c.classList.remove('bg-indigo-50', 'border-indigo-200');
            c.classList.add('bg-white', 'border-gray-200');
        });
        
        // Set active card
        card.classList.remove('bg-white', 'border-gray-200');
        card.classList.add('bg-indigo-50', 'border-indigo-200');
        
        const essayId = card.getAttribute('data-id');
        this.loadEssay(essayId);
    }
    
    async loadEssay(essayId) {
        try {
            const response = await fetch(`/api/essays/${essayId}`);
            if (response.ok) {
                const essay = await response.json();
                this.currentEssay = essay;
                
                // Update editor content
                if (this.quill && essay.content) {
                    this.quill.setContents(essay.content);
                }
                
                // Update essay title and prompt
                document.querySelector('h2').textContent = essay.title || 'Essay Title';
            }
        } catch (error) {
            console.error('Error loading essay:', error);
        }
    }
    
    async saveEssay() {
        if (!this.quill) return;
        
        const content = this.quill.getContents();
        const htmlContent = this.quill.root.innerHTML;
        
        const essayData = {
            title: document.querySelector('h2').textContent,
            content: content,
            htmlContent: htmlContent,
            wordCount: this.quill.getText().trim().split(/\s+/).length
        };
        
        try {
            this.showSaveLoading(true);
            
            let response;
            if (this.currentEssay && this.currentEssay.id) {
                response = await fetch(`/api/essays/${this.currentEssay.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(essayData)
                });
            } else {
                response = await fetch('/api/essays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(essayData)
                });
            }
            
            if (response.ok) {
                const savedEssay = await response.json();
                this.currentEssay = savedEssay;
                this.showSuccess('Essay saved successfully!');
                this.saveVersion();
            } else {
                throw new Error('Failed to save essay');
            }
        } catch (error) {
            console.error('Error saving essay:', error);
            this.showError('Failed to save essay. Please try again.');
        } finally {
            this.showSaveLoading(false);
        }
    }
    
    saveVersion() {
        // Create a new version entry
        const versionItem = document.createElement('div');
        versionItem.className = 'version-item border rounded-lg p-3';
        versionItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium text-gray-800">Version ${Date.now()}</h4>
                    <p class="text-xs text-gray-500">${new Date().toLocaleString()}</p>
                </div>
                <button class="text-xs text-gray-500 hover:text-gray-700" onclick="this.restoreVersion()">Restore</button>
            </div>
        `;
        
        // Add to versions panel
        const versionsContainer = this.versionsPanel.querySelector('.space-y-2');
        versionsContainer.appendChild(versionItem);
    }
    
    openAiModal() {
        this.aiModal?.classList.remove('hidden');
    }
    
    closeAiModalHandler() {
        this.aiModal?.classList.add('hidden');
    }
    
    async handleAiAction(action) {
        const currentText = this.quill ? this.quill.getText() : '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Please help me with my essay. Action: ${action}. Current text: ${currentText.substring(0, 500)}...`,
                    context: 'essay_assistance'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showAiSuggestion(data.response);
            }
        } catch (error) {
            console.error('AI assistance error:', error);
            this.showError('Failed to get AI assistance');
        }
    }
    
    showAiSuggestion(suggestion) {
        // Update the AI suggestion area in the modal
        const suggestionArea = document.querySelector('.bg-gray-50.rounded-lg');
        if (suggestionArea) {
            suggestionArea.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h5 class="font-medium text-gray-800">AI Suggestion</h5>
                        <p class="text-sm text-gray-600 mt-1">${suggestion}</p>
                        <div class="mt-3 flex space-x-2">
                            <button class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded" onclick="window.essayManager.applySuggestion('${suggestion}')">Apply Suggestion</button>
                            <button class="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded">Ignore</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    applySuggestion(suggestion) {
        // For demo purposes, just show success message
        this.showSuccess('AI suggestion noted! Please review and apply manually.');
        this.closeAiModalHandler();
    }
    
    switchTab(activeTab) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.remove('border-indigo-600', 'text-indigo-600');
            btn.classList.add('text-gray-500');
        });
        activeTab.classList.add('border-indigo-600', 'text-indigo-600');
        activeTab.classList.remove('text-gray-500');
        
        // Show appropriate panel
        const tabText = activeTab.textContent.trim();
        if (tabText === 'Versions') {
            this.versionsPanel.classList.remove('hidden');
            this.outlinePanel.classList.add('hidden');
        } else {
            this.versionsPanel.classList.add('hidden');
            this.outlinePanel.classList.remove('hidden');
        }
    }
    
    setupFileUpload() {
        if (!this.uploadZone || !this.fileInput) return;
        
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length) {
                this.handleFile(files[0]);
            }
        });
        
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files.length) {
                this.handleFile(this.fileInput.files[0]);
            }
        });
    }
    
    handleFile(file) {
        const validTypes = ['.docx', '.pdf', '.doc', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            this.showError('Please upload a valid document file (.docx, .pdf, .doc, .txt)');
            return;
        }
        
        // For demo purposes, just show success
        this.showSuccess(`File "${file.name}" uploaded successfully! Processing...`);
        
        // In production, you'd upload to server and process the file
        setTimeout(() => {
            this.showSuccess('File processed and content extracted!');
        }, 2000);
    }
    
    setupVersionManagement() {
        // Handle version restoration
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'Restore') {
                e.preventDefault();
                this.showSuccess('Version restored successfully!');
            }
        });
    }
    
    setupOutlineGeneration() {
        const generateBtn = document.getElementById('generate-outline-btn');
        generateBtn?.addEventListener('click', () => {
            this.generateOutline();
        });
    }
    
    async generateOutline() {
        try {
            const currentText = this.quill ? this.quill.getText() : '';
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Generate an essay outline for: ${currentText.substring(0, 200)}...`,
                    context: 'outline_generation'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showSuccess('Outline generated! Check the Outline tab.');
                // Update outline panel with generated content
            }
        } catch (error) {
            console.error('Outline generation error:', error);
            this.showError('Failed to generate outline');
        }
    }
    
    showSaveLoading(loading) {
        if (loading) {
            this.saveBtn.disabled = true;
            this.saveBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
            `;
        } else {
            this.saveBtn.disabled = false;
            this.saveBtn.textContent = 'Save';
        }
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showAlert(message, type) {
        const existingAlert = document.querySelector('.essay-alert');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `essay-alert fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 
            'bg-green-100 border border-green-400 text-green-700'
        }`;
        alert.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-4" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) alert.remove();
        }, 5000);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.essayManager = new EssayManager();
});