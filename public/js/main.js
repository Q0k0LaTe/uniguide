// Global utility functions and navigation management
class UniGuideApp {
    constructor() {
        this.currentUser = null;
        this.initializeApp();
    }
    
    initializeApp() {
        this.loadUserData();
        this.setupGlobalNavigation();
        this.setupMobileMenu();
        this.setupUserMenu();
        this.setupFloatingChat();
        this.setupGlobalEventListeners();
        this.initializeCurrentPage();
    }
    
    loadUserData() {
        const userData = localStorage.getItem('uniguide-user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserUI();
            } catch (error) {
                console.error('Error loading user data:', error);
                localStorage.removeItem('uniguide-user');
            }
        }
    }
    
    updateUserUI() {
        if (!this.currentUser) return;
        
        // Update user name displays
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.name;
        });
        
        // Update user initials
        const userInitialsElements = document.querySelectorAll('[data-user-initials]');
        userInitialsElements.forEach(el => {
            const initials = this.currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            el.textContent = initials;
        });
        
        // Update profile pictures with initials
        const profileElements = document.querySelectorAll('.profile-initials');
        profileElements.forEach(el => {
            const initials = this.currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            el.textContent = initials;
        });
    }
    
    setupGlobalNavigation() {
        // Handle all navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Handle internal navigation
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                e.preventDefault();
                this.navigateTo(href);
            }
            
            // Handle navigation menu items
            if (link.classList.contains('nav-link')) {
                this.updateActiveNavLink(link);
            }
        });
    }
    
    navigateTo(path) {
        // Add loading state
        this.showPageLoading(true);
        
        // Simulate navigation (in real app, this would be handled by router)
        setTimeout(() => {
            window.location.href = path;
        }, 300);
    }
    
    updateActiveNavLink(activeLink) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active-nav');
        });
        
        // Add active class to clicked link
        activeLink.classList.add('active-nav');
    }
    
    setupMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    }
    
    setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        
        if (userMenuButton) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }
        
        // Handle logout clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-logout]')) {
                e.preventDefault();
                this.logout();
            }
        });
        
        // Close user menu when clicking outside
        document.addEventListener('click', () => {
            if (userMenu && !userMenu.classList.contains('hidden')) {
                userMenu.classList.add('hidden');
            }
        });
    }
    
    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.toggle('hidden');
        }
    }
    
    setupFloatingChat() {
        const floatingChatBtn = document.querySelector('.floating-chat-btn');
        if (floatingChatBtn) {
            floatingChatBtn.addEventListener('click', () => {
                window.location.href = '/chat';
            });
        }
        
        // Create floating chat button if not exists and not on chat page
        if (!floatingChatBtn && !window.location.pathname.includes('/chat')) {
            this.createFloatingChatButton();
        }
    }
    
    createFloatingChatButton() {
        const button = document.createElement('button');
        button.className = 'floating-chat-btn fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg z-40 transition-all duration-300 hover:scale-110';
        button.innerHTML = `
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        `;
        
        button.addEventListener('click', () => {
            window.location.href = '/chat';
        });
        
        document.body.appendChild(button);
    }
    
    setupGlobalEventListeners() {
        // Handle form submissions globally
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM' && !form.hasAttribute('data-no-prevent')) {
                this.handleFormSubmission(e);
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHide();
            } else {
                this.onPageShow();
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showConnectionStatus('online');
        });
        
        window.addEventListener('offline', () => {
            this.showConnectionStatus('offline');
        });
    }
    
    handleFormSubmission(e) {
        // Add loading state to submit buttons
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.hasAttribute('data-no-loading')) {
            this.setButtonLoading(submitBtn, true);
            
            // Reset loading state after 5 seconds as fallback
            setTimeout(() => {
                this.setButtonLoading(submitBtn, false);
            }, 5000);
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K to open search (future feature)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openGlobalSearch();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }
    
    openGlobalSearch() {
        // Future implementation for global search
        this.showNotification('Global search coming soon!', 'info');
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal, [id$="-modal"]');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }
    
    onPageHide() {
        // Save any pending data when page is hidden
        this.autoSave();
    }
    
    onPageShow() {
        // Refresh user session when page becomes visible
        this.checkUserSession();
    }
    
    autoSave() {
        // Trigger auto-save for current page
        const event = new CustomEvent('auto-save');
        document.dispatchEvent(event);
    }
    
    async checkUserSession() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch('/api/user/session-check');
            if (!response.ok) {
                this.logout();
            }
        } catch (error) {
            console.warn('Session check failed:', error);
        }
    }
    
    showConnectionStatus(status) {
        const existing = document.querySelector('.connection-status');
        if (existing) existing.remove();
        
        const statusEl = document.createElement('div');
        statusEl.className = `connection-status fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 ${
            status === 'online' ? 'bg-green-600' : 'bg-red-600'
        }`;
        statusEl.textContent = status === 'online' ? 'Back online' : 'You are offline';
        
        document.body.appendChild(statusEl);
        
        setTimeout(() => {
            if (statusEl.parentElement) {
                statusEl.remove();
            }
        }, 3000);
    }
    
    initializeCurrentPage() {
        const pathname = window.location.pathname;
        
        // Page-specific initialization
        switch (pathname) {
            case '/':
                this.initializeHomepage();
                break;
            case '/dashboard':
                this.initializeDashboard();
                break;
            case '/colleges':
                this.initializeColleges();
                break;
            case '/essays':
                this.initializeEssays();
                break;
            case '/tasks':
                this.initializeTasks();
                break;
            case '/chat':
                this.initializeChat();
                break;
    initializeCurrentPage() {
        const pathname = window.location.pathname;
        
        // Page-specific initialization
        switch (pathname) {
            case '/':
                this.initializeHomepage();
                break;
            case '/dashboard':
                this.initializeDashboard();
                break;
            case '/colleges':
                this.initializeColleges();
                break;
            case '/essays':
                this.initializeEssays();
                break;
            case '/tasks':
                this.initializeTasks();
                break;
            case '/chat':
                this.initializeChat();
                break;
            case '/settings':
                this.initializeSettings();
                break;
            case '/wizard':
                this.initializeWizard();
                break;
        }
    }
    
    initializeHomepage() {
        // Homepage-specific functionality
        this.setupHeroButtons();
        this.setupFeatureCards();
        this.initializeAnimations();
    }
    
    setupHeroButtons() {
        const startBtn = document.querySelector('a[href="#"]:contains("开始使用")');
        const learnMoreBtn = document.querySelector('a[href="#"]:contains("了解更多")');
        
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentUser) {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
            });
        }
        
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToFeatures();
            });
        }
    }
    
    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const links = card.querySelectorAll('a');
                if (links.length > 0) {
                    links[0].click();
                }
            });
        });
    }
    
    scrollToFeatures() {
        const featuresSection = document.querySelector('.功能概览') || 
                               document.querySelector('[class*="feature"]').closest('section');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    initializeAnimations() {
        const animatedElements = document.querySelectorAll('.animate-fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
    
    initializeDashboard() {
        this.loadDashboardWidgets();
        this.setupQuickActions();
    }
    
    async loadDashboardWidgets() {
        try {
            // Load user progress
            const progressResponse = await fetch('/api/user/progress');
            if (progressResponse.ok) {
                const progress = await progressResponse.json();
                this.updateProgressWidgets(progress);
            }
            
            // Load upcoming tasks
            const tasksResponse = await fetch('/api/tasks?upcoming=true');
            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                this.updateTasksWidget(tasks);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    setupQuickActions() {
        const quickActionBtns = document.querySelectorAll('[data-quick-action]');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-quick-action');
                this.handleQuickAction(action);
            });
        });
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'new-essay':
                window.location.href = '/essays?new=true';
                break;
            case 'search-colleges':
                window.location.href = '/colleges';
                break;
            case 'add-task':
                window.location.href = '/tasks?new=true';
                break;
            case 'ai-chat':
                window.location.href = '/chat';
                break;
            default:
                console.log('Unknown quick action:', action);
        }
    }
    
    initializeColleges() {
        // Colleges page initialization handled by college.js
    }
    
    initializeEssays() {
        // Essays page initialization handled by essay.js
    }
    
    initializeTasks() {
        // Tasks page initialization handled by task.js
    }
    
    initializeChat() {
        // Chat page initialization handled by chat.js
    }
    
    initializeSettings() {
        this.setupSettingsNavigation();
        this.setupSettingsSave();
    }
    
    setupSettingsNavigation() {
        const settingsNavLinks = document.querySelectorAll('.settings-nav a');
        settingsNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSettingsSection(target);
            });
        });
    }
    
    showSettingsSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }
    
    setupSettingsSave() {
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }
    
    async saveSettings() {
        // Collect all form data from settings
        const formData = new FormData();
        const inputs = document.querySelectorAll('.settings-section input, .settings-section select, .settings-section textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                formData.append(input.name, input.checked);
            } else {
                formData.append(input.name, input.value);
            }
        });
        
        try {
            const response = await fetch('/api/user/settings', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.showNotification('Settings saved successfully!', 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    initializeWizard() {
        // Wizard initialization handled by wizard.js
    }
    
    // Utility Functions
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }
    
    showPageLoading(show) {
        let loader = document.getElementById('page-loader');
        
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'page-loader';
            loader.className = 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="mt-2 text-gray-600">Loading...</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-100 border border-green-400 text-green-700',
            error: 'bg-red-100 border border-red-400 text-red-700',
            warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border border-blue-400 text-blue-700'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button class="ml-4 text-current hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('uniguide-user');
            localStorage.removeItem('uniguide-wizard-data');
            localStorage.removeItem('uniguide-chat-history');
            window.location.href = '/login';
        }
    }
    
    // API Helper Methods
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(endpoint, { ...defaultOptions, ...options });
            
            if (response.status === 401) {
                this.logout();
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            this.showNotification('Network error occurred', 'error');
            throw error;
        }
    }
    
    // Data validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePhone(phone) {
        const phoneRegex = /^[\+]?[\d\-\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return new Intl.DateTimeFormat('zh-CN', defaultOptions).format(new Date(date));
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global helper functions for backward compatibility
window.UniGuideUtils = {
    showNotification: (message, type, duration) => {
        if (window.uniGuideApp) {
            window.uniGuideApp.showNotification(message, type, duration);
        }
    },
    
    setButtonLoading: (button, loading) => {
        if (window.uniGuideApp) {
            window.uniGuideApp.setButtonLoading(button, loading);
        }
    },
    
    apiCall: (endpoint, options) => {
        if (window.uniGuideApp) {
            return window.uniGuideApp.apiCall(endpoint, options);
        }
    },
    
    logout: () => {
        if (window.uniGuideApp) {
            window.uniGuideApp.logout();
        }
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.uniGuideApp = new UniGuideApp();
    
    // Make app globally available for debugging
    if (process?.env?.NODE_ENV === 'development') {
        window.app = window.uniGuideApp;
    }
});