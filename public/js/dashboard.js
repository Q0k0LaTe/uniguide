document.addEventListener('DOMContentLoaded', () => {
    // Header elements
    const userAvatarImg = document.getElementById('user-avatar-img');

    // Tab content containers
    const collegeCardsGrid = document.getElementById('college-cards-grid');
    const essaysList = document.getElementById('essays-list');
    const upcomingDeadlinesList = document.getElementById('upcoming-deadlines-list');
    // const calendarGrid = document.querySelector('#timeline-tab .grid-cols-7'); // For full calendar integration later

    // Modals (event listeners for these are already in dashboard.html)
    // const addCollegeModal = document.getElementById('add-college-modal');
    // const addEssayModal = document.getElementById('add-essay-modal');
    // const addEventModal = document.getElementById('add-event-modal');

    // API Endpoints
    const USER_PROFILE_API = '/api/user/profile';
    const TASKS_API = '/api/tasks'; // tasks will be filtered for deadlines client-side or use params
    const USER_COLLEGES_API = '/api/profile'; // Changed this to use the existing populated profile endpoint
    const ESSAYS_API = '/api/essays';


    // --- Data Fetching Functions ---

    async function fetchData(url, errorMessage = 'Failed to fetch data') {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`HTTP error ${response.status}: ${errorBody}`);
                throw new Error(`${errorMessage} (Status: ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            throw error; // Re-throw to be caught by calling function
        }
    }

    async function fetchUserProfile() {
        try {
            const profile = await fetchData(USER_PROFILE_API, 'Failed to fetch user profile');
            if (profile && userAvatarImg) {
                userAvatarImg.src = profile.profilePic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'; // Default if no profilePic
                // You can also update user name/email if you add elements for them in the header/sidebar
            }
        } catch (error) {
            if (userAvatarImg) userAvatarImg.alt = "Error loading profile";
        }
    }

    async function fetchAndRenderColleges() {
        if (!collegeCardsGrid) return;
        try {
            const profileWithColleges = await fetchData(USER_COLLEGES_API, 'Failed to fetch user colleges');
            collegeCardsGrid.innerHTML = ''; // Clear existing

            const allColleges = [
                ...(profileWithColleges.safetySchools || []),
                ...(profileWithColleges.targetSchools || []),
                ...(profileWithColleges.reachSchools || [])
            ];

            if (allColleges.length === 0) {
                collegeCardsGrid.innerHTML = '<p class="text-gray-500 col-span-full">No colleges added yet. Click "Add College" to get started!</p>';
                return;
            }

            allColleges.forEach(college => {
                // Assuming 'college' objects from UserProfile.safety/target/reachSchools are populated with College details
                // If not, you'd need another fetch for each collegeId or a richer API endpoint
                const cardHtml = `
                    <div class="card bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="college-logo">
                                    <span>${college.name ? college.name.substring(0, 2).toUpperCase() : 'N/A'}</span>
                                </div>
                                <span class="status-badge status-${college.applicationStatus || 'drafting'}">${college.applicationStatus || 'Drafting'}</span>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900">${college.name || 'Unnamed College'}</h3>
                            <div class="mt-2 text-sm text-gray-500">
                                <p>${college.location || 'N/A'}</p>
                                <p class="mt-1">Deadline: ${college.deadline ? new Date(college.deadline).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div class="mt-4 border-t border-gray-200 pt-4">
                                <h4 class="text-sm font-medium text-gray-900">Your Notes</h4>
                                <p class="mt-1 text-sm text-gray-600 line-clamp-3">${college.notes || 'No notes yet.'}</p>
                            </div>
                            <div class="mt-4 flex justify-between">
                                <button class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 edit-college-btn" data-college-id="${college._id}">
                                    <i class="fas fa-edit mr-1"></i> Edit
                                </button>
                                <button class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 view-college-details-btn" data-college-id="${college._id}">
                                    <i class="fas fa-external-link-alt mr-1"></i> View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                collegeCardsGrid.insertAdjacentHTML('beforeend', cardHtml);
            });
        } catch (error) {
            collegeCardsGrid.innerHTML = '<p class="text-red-500 col-span-full">Error loading colleges. Please try again later.</p>';
        }
    }

    async function fetchAndRenderEssays() {
        if (!essaysList) return;
        try {
            const essays = await fetchData(ESSAYS_API, 'Failed to fetch essays');
            essaysList.innerHTML = ''; // Clear existing

            if (essays.length === 0) {
                essaysList.innerHTML = '<li class="px-4 py-4 sm:px-6 text-gray-500">No essays found. Click "New Essay" to add one.</li>';
                return;
            }

            essays.forEach(essay => {
                const collegeShortName = essay.collegeApplication ? (essay.collegeApplication.name ? essay.collegeApplication.name.substring(0,3).toUpperCase() : 'GEN') : 'GEN';
                const essayHtml = `
                    <li>
                        <div class="px-4 py-4 sm:px-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span class="text-indigo-600 font-medium">${collegeShortName}</span>
                                    </div>
                                    <div class="ml-4">
                                        <h4 class="text-sm font-medium text-gray-900">${essay.title || 'Untitled Essay'}</h4>
                                        <p class="text-xs text-gray-500">${essay.wordLimit || 'N/A'} words max</p>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <span class="status-badge status-${essay.status ? essay.status.toLowerCase().replace(' ', '-') : 'not-started'}">
                                        ${essay.status || 'Not Started'}
                                    </span>
                                    <button class="ml-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium view-essay-btn" data-essay-id="${essay._id}">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mt-2 sm:flex sm:justify-between">
                                <div class="sm:flex">
                                    <p class="flex items-center text-sm text-gray-500">
                                        <i class="fas fa-clock flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"></i>
                                        Last edited: ${essay.lastUpdated ? new Date(essay.lastUpdated).toLocaleDateString() : 'N/A'}
                                    </p>
                                    <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                        <i class="fas fa-file-alt flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"></i>
                                        ${essay.versions ? essay.versions.length : 0} versions
                                    </p>
                                </div>
                            </div>
                            ${essay.content ? `
                            <div class="mt-4 border-t border-gray-100 pt-4">
                                <!-- <div class="flex space-x-2">
                                    <span class="essay-version essay-version-active">V3 (Current)</span>
                                </div> -->
                                <p class="mt-2 text-sm text-gray-600 line-clamp-2">
                                    ${essay.content.substring(0, 150)}...
                                </p>
                            </div>` : ''}
                        </div>
                    </li>
                `;
                essaysList.insertAdjacentHTML('beforeend', essayHtml);
            });
        } catch (error) {
            essaysList.innerHTML = '<li class="px-4 py-4 sm:px-6 text-red-500">Error loading essays. Please try again later.</li>';
        }
    }
    
    async function fetchAndRenderUpcomingDeadlines() {
        if (!upcomingDeadlinesList) return;
        try {
            // Fetch all tasks, then filter and sort
            // Or adjust API: /api/tasks?status=pending&sortBy=dueDate&limit=5
            const tasks = await fetchData(`${TASKS_API}?sortBy=dueDate&status=Not%20Completed&limit=5`, 'Failed to fetch tasks for deadlines');
            upcomingDeadlinesList.innerHTML = ''; // Clear existing

            const deadlines = tasks
                .filter(task => !task.completed && task.dueDate) // Ensure it has a due date and is not completed
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) // Sort by due date
                .slice(0, 5); // Get top 5

            if (deadlines.length === 0) {
                upcomingDeadlinesList.innerHTML = '<li class="px-4 py-4 sm:px-6 text-gray-500">No upcoming deadlines.</li>';
                return;
            }

            deadlines.forEach(deadline => {
                const priorityClass = deadline.priority === 'High' ? 'bg-red-100 text-red-800' : (deadline.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');
                const iconClass = deadline.priority === 'High' ? 'fa-calendar-day text-red-600' : 'fa-tasks text-yellow-600'; // Simplified icon logic

                const deadlineHtml = `
                    <li>
                        <div class="px-4 py-4 sm:px-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10 rounded-full ${priorityClass.split(' ')[0]} flex items-center justify-center">
                                        <i class="fas ${iconClass}"></i>
                                    </div>
                                    <div class="ml-4">
                                        <h4 class="text-sm font-medium text-gray-900">${deadline.title}</h4>
                                        <p class="text-xs text-gray-500">${new Date(deadline.dueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityClass}">
                                        ${deadline.priority || 'Medium'} Priority
                                    </span>
                                </div>
                            </div>
                        </div>
                    </li>
                `;
                upcomingDeadlinesList.insertAdjacentHTML('beforeend', deadlineHtml);
            });
        } catch (error) {
            upcomingDeadlinesList.innerHTML = '<li class="px-4 py-4 sm:px-6 text-red-500">Error loading deadlines. Please try again later.</li>';
        }
    }

    // --- Event Handlers & Initial Load ---

    // Tab switching is handled by existing script in dashboard.html
    // Modal opening/closing is handled by existing script in dashboard.html
    // Form submissions (e.g., add college/essay/event) are handled by existing script,
    // but you'll want to replace the alert('Form submitted successfully!'); with actual API calls.

    function initializeDashboard() {
        fetchUserProfile();
        fetchAndRenderColleges();
        fetchAndRenderEssays();
        fetchAndRenderUpcomingDeadlines();
        // fetchAndRenderCalendarEvents(); // For full calendar later
    }

    initializeDashboard();
}); 