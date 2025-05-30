// Authentication functionality
class AuthManager {
    constructor() {
        this.initializeLoginForm();
        this.initializeRegisterForm();
        this.checkAuthStatus();
    }
    
    initializeLoginForm() {
        const loginForm = document.querySelector('#login-panel form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });
        }
    }
    
    initializeRegisterForm() {
        const registerForm = document.querySelector('#register-panel form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });
        }
    }
    
    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            this.showError('请填写所有必填字段');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('登录成功！正在跳转...');
                // Store user info
                localStorage.setItem('uniguide-user', JSON.stringify(data.user));
                // Redirect to wizard or dashboard
                setTimeout(() => {
                    window.location.href = '/wizard';
                }, 1000);
            } else {
                this.showError(data.error || '登录失败');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleRegister(form) {
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('password-confirm');
        
        if (!name || !email || !password || !confirmPassword) {
            this.showError('请填写所有必填字段');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }
        
        if (password.length < 6) {
            this.showError('密码长度至少6位');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('注册成功！正在跳转...');
                // Store user info
                localStorage.setItem('uniguide-user', JSON.stringify(data.user));
                // Redirect to wizard
                setTimeout(() => {
                    window.location.href = '/wizard';
                }, 1000);
            } else {
                this.showError(data.error || '注册失败');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('网络错误，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('uniguide-user');
            window.location.href = '/login';
        }
    }
    
    checkAuthStatus() {
        const user = localStorage.getItem('uniguide-user');
        const currentPath = window.location.pathname;
        
        // Protected routes
        const protectedRoutes = ['/wizard', '/dashboard', '/colleges', '/essays', '/tasks', '/chat', '/settings'];
        
        if (protectedRoutes.includes(currentPath) && !user) {
            window.location.href = '/login';
        }
        
        // Redirect logged-in users away from login page
        if (currentPath === '/login' && user) {
            window.location.href = '/dashboard';
        }
        
        // Update UI with user info
        if (user) {
            this.updateUserUI(JSON.parse(user));
        }
    }
    
    updateUserUI(user) {
        // Update user name in navigation
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(el => {
            el.textContent = user.name;
        });
        
        // Update user initials
        const userInitialsElements = document.querySelectorAll('[data-user-initials]');
        userInitialsElements.forEach(el => {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            el.textContent = initials;
        });
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.auth-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `auth-alert fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
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
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
    
    showLoading(show) {
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            if (show) {
                button.disabled = true;
                button.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                `;
            } else {
                button.disabled = false;
                // Restore original text (this is a simplified version)
                const isLogin = button.closest('#login-panel');
                button.textContent = isLogin ? '登录' : '注册';
            }
        });
    }
}

// Tab switching functionality for login/register
class LoginTabManager {
    constructor() {
        this.loginTab = document.getElementById('login-tab');
        this.registerTab = document.getElementById('register-tab');
        this.loginPanel = document.getElementById('login-panel');
        this.registerPanel = document.getElementById('register-panel');
        
        if (this.loginTab && this.registerTab) {
            this.initializeTabs();
        }
    }
    
    initializeTabs() {
        this.loginTab.addEventListener('click', () => this.showLogin());
        this.registerTab.addEventListener('click', () => this.showRegister());
    }
    
    showLogin() {
        this.loginTab.classList.add('tab-active');
        this.loginTab.classList.remove('tab-inactive');
        this.registerTab.classList.add('tab-inactive');
        this.registerTab.classList.remove('tab-active');
        
        this.loginPanel.classList.remove('hidden');
        this.registerPanel.classList.add('hidden');
    }
    
    showRegister() {
        this.registerTab.classList.add('tab-active');
        this.registerTab.classList.remove('tab-inactive');
        this.loginTab.classList.add('tab-inactive');
        this.loginTab.classList.remove('tab-active');
        
        this.registerPanel.classList.remove('hidden');
        this.loginPanel.classList.add('hidden');
    }
}

// Logout functionality
function setupLogoutButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-logout]')) {
            e.preventDefault();
            const authManager = new AuthManager();
            authManager.logout();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
    new LoginTabManager();
    setupLogoutButtons();
});