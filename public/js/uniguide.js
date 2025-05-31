document.addEventListener('DOMContentLoaded', async () => {
    const loginRedirectUrl = '/login.html';
    // const dashboardUrl = '/dashboard.html'; // No longer needed for immediate redirect

    // Helper function to check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            if (!response.ok) {
                console.error('Auth status check failed:', response.status);
                return false;
            }
            const data = await response.json();
            return data.isLoggedIn;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    // REMOVED: Initial Authentication Check for immediate redirect
    // if (window.location.pathname === '/UniGuide.html' || window.location.pathname === '/') { 
    //     const isAuthenticated = await checkAuthStatus();
    //     if (isAuthenticated) {
    //         window.location.href = dashboardUrl;
    //         return; 
    //     }
    // }

    // Update nav based on auth status on page load
    updateUserNav(); 

    // Helper function to handle navigation for links
    async function handleAuthRedirect(event, targetUrl) {
        event.preventDefault();
        const isAuthenticated = await checkAuthStatus(); 
        if (isAuthenticated) {
            window.location.href = targetUrl;
        } else {
            window.location.href = loginRedirectUrl;
        }
    }

    const elementsToProtect = [
        { id: 'nav-college-select', target: '/college.html' },
        { id: 'nav-essay-writing', target: '/essay.html' },
        { id: 'nav-app-calendar', target: '/task.html' },
        { id: 'nav-ai-assistant', target: '/ChatUniGuide.html' },
        { id: 'user-menu-button', target: '/settings.html' },
        { id: 'mobile-nav-college-select', target: '/college.html' },
        { id: 'mobile-nav-essay-writing', target: '/essay.html' },
        { id: 'mobile-nav-app-calendar', target: '/task.html' },
        { id: 'mobile-nav-ai-assistant', target: '/ChatUniGuide.html' },
        { id: 'mobile-nav-profile', target: '/settings.html' },
        { id: 'mobile-nav-settings', target: '/settings.html' },
        { id: 'hero-start-using', target: '/dashboard.html' },
        { id: 'feature-match-colleges', target: '/college.html' },
        { id: 'feature-start-writing', target: '/essay.html' },
        { id: 'feature-plan-schedule', target: '/task.html' },
        { id: 'dashboard-view-progress', target: '/dashboard.html' },
        { id: 'dashboard-view-calendar', target: '/task.html' },
        { id: 'dashboard-view-tasks', target: '/task.html' },
    ];

    elementsToProtect.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.addEventListener('click', (event) => handleAuthRedirect(event, item.target));
        }
    });

    const ctaRegister = document.getElementById('cta-register');
    if (ctaRegister) {
        ctaRegister.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = loginRedirectUrl;
        });
    }

    const heroLearnMore = document.getElementById('hero-learn-more');
    if (heroLearnMore) {
        heroLearnMore.addEventListener('click', (e) => {
            e.preventDefault();
            const footerElement = document.querySelector('footer');
            if (footerElement) {
                footerElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Update user display in navbar if logged in
    async function updateUserNav() {
        const isAuthenticated = await checkAuthStatus();
        const userMenuButton = document.getElementById('user-menu-button');
        const mobileUserAvatarContainer = document.querySelector('#mobile-menu .flex-shrink-0 .h-10.w-10');
        const mobileUserName = document.querySelector('#mobile-menu .ml-3 .text-base.font-medium.text-gray-800');
        const mobileUserEmail = document.querySelector('#mobile-menu .ml-3 .text-sm.font-medium.text-gray-500');

        if (isAuthenticated) {
            const userName = '张同学'; // Placeholder - Fetch from server in real app
            const userInitials = '张'; // Placeholder
            const userEmail = 'zhang@example.com'; // Placeholder

            if (userMenuButton) {
                const userInitialsSpan = userMenuButton.querySelector('span:not(.sr-only)');
                if (userInitialsSpan) userInitialsSpan.textContent = userInitials;
            }
            if (mobileUserAvatarContainer) {
                const mobileUserInitialsSpan = mobileUserAvatarContainer.querySelector('span');
                if (mobileUserInitialsSpan) mobileUserInitialsSpan.textContent = userInitials;
            }
            if (mobileUserName) mobileUserName.textContent = userName;
            if (mobileUserEmail) mobileUserEmail.textContent = userEmail;

        } else {
            if (userMenuButton) {
                 const userInitialsSpan = userMenuButton.querySelector('span:not(.sr-only)');
                 if (userInitialsSpan) userInitialsSpan.innerHTML = '<span class="text-indigo-600 font-bold text-sm">用户</span>'; 
            }
            if (mobileUserAvatarContainer) {
                const mobileUserInitialsSpan = mobileUserAvatarContainer.querySelector('span');
                if (mobileUserInitialsSpan) mobileUserInitialsSpan.textContent = '用户';
            }
            if (mobileUserName) mobileUserName.textContent = '访客用户'; 
            if (mobileUserEmail) mobileUserEmail.textContent = '请登录或注册';
        }
    }
}); 