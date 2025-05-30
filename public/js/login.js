document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginPanel = document.getElementById('login-panel');
    const registerPanel = document.getElementById('register-panel');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const loginErrorMessage = document.getElementById('login-error-message');
    const registerErrorMessage = document.getElementById('register-error-message');
    const registerSuccessMessage = document.getElementById('register-success-message');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('tab-active');
        loginTab.classList.remove('tab-inactive');
        registerTab.classList.add('tab-inactive');
        registerTab.classList.remove('tab-active');

        loginPanel.classList.remove('hidden');
        loginPanel.classList.add('animate-fade-in');
        registerPanel.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('tab-active');
        registerTab.classList.remove('tab-inactive');
        loginTab.classList.add('tab-inactive');
        loginTab.classList.remove('tab-active');

        registerPanel.classList.remove('hidden');
        registerPanel.classList.add('animate-fade-in');
        loginPanel.classList.add('hidden');
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginErrorMessage.classList.add('hidden');
            loginErrorMessage.textContent = '';

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    // Successful login
                    window.location.href = '/dashboard.html'; // Redirect to dashboard
                } else {
                    const data = await response.json();
                    loginErrorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                    loginErrorMessage.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Login error:', error);
                loginErrorMessage.textContent = 'An error occurred. Please try again.';
                loginErrorMessage.classList.remove('hidden');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerErrorMessage.classList.add('hidden');
            registerErrorMessage.textContent = '';
            registerSuccessMessage.classList.add('hidden');
            registerSuccessMessage.textContent = '';

            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm['register-password'].value;
            const passwordConfirm = registerForm['password-confirm'].value;
            const invitationCode = registerForm.invitationCode.value;
            const agreeTerms = registerForm['agree-terms'].checked;

            if (password !== passwordConfirm) {
                registerErrorMessage.textContent = 'Passwords do not match.';
                registerErrorMessage.classList.remove('hidden');
                return;
            }

            if (!agreeTerms) {
                registerErrorMessage.textContent = 'You must agree to the terms and conditions.';
                registerErrorMessage.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password, invitationCode }),
                });

                const data = await response.json();

                if (response.ok) {
                    registerSuccessMessage.textContent = data.message || 'Registration successful! Please log in.';
                    registerSuccessMessage.classList.remove('hidden');
                    registerForm.reset();
                    // Optionally, switch to login tab
                    // loginTab.click();
                } else {
                    registerErrorMessage.textContent = data.message || 'Registration failed. Please try again.';
                    registerErrorMessage.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerErrorMessage.textContent = 'An error occurred. Please try again.';
                registerErrorMessage.classList.remove('hidden');
            }
        });
    }
}); 