const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// DeepSeek AI Configuration
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-e249e4bf4442448a94cc64426d1c3cf8'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'uniguide-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// In-memory databases (replace with real database in production)
const users = new Map();
const colleges = new Map();
const userProfiles = new Map();
const collegeNotes = new Map();
const essays = new Map();
const tasks = new Map();
const chatHistory = new Map();

// Sample college data
const sampleColleges = [
    {
        id: 1,
        name: "Harvard University",
        location: "Cambridge, MA",
        type: "Private",
        ranking: 1,
        tuition: 54768,
        acceptanceRate: 4.6,
        description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts.",
        website: "https://www.harvard.edu",
        image: "/images/harvard.jpg",
        programs: ["Computer Science", "Medicine", "Law", "Business"],
        requirements: {
            gpa: 3.9,
            sat: 1520,
            toefl: 100
        }
    },
    {
        id: 2,
        name: "Stanford University",
        location: "Stanford, CA",
        type: "Private",
        ranking: 2,
        tuition: 56169,
        acceptanceRate: 4.3,
        description: "Stanford University is a private research university in Stanford, California.",
        website: "https://www.stanford.edu",
        image: "/images/stanford.jpg",
        programs: ["Engineering", "Computer Science", "Business", "Medicine"],
        requirements: {
            gpa: 3.8,
            sat: 1510,
            toefl: 100
        }
    },
    {
        id: 3,
        name: "MIT",
        location: "Cambridge, MA",
        type: "Private",
        ranking: 3,
        tuition: 55878,
        acceptanceRate: 6.7,
        description: "MIT is a private land-grant research university in Cambridge, Massachusetts.",
        website: "https://www.mit.edu",
        image: "/images/mit.jpg",
        programs: ["Engineering", "Computer Science", "Physics", "Mathematics"],
        requirements: {
            gpa: 3.9,
            sat: 1530,
            toefl: 100
        }
    },
    {
        id: 4,
        name: "University of California, Berkeley",
        location: "Berkeley, CA",
        type: "Public",
        ranking: 4,
        tuition: 43980,
        acceptanceRate: 14.5,
        description: "UC Berkeley is a public land-grant research university in Berkeley, California.",
        website: "https://www.berkeley.edu",
        image: "/images/berkeley.jpg",
        programs: ["Engineering", "Computer Science", "Business", "Liberal Arts"],
        requirements: {
            gpa: 3.7,
            sat: 1450,
            toefl: 90
        }
    },
    {
        id: 5,
        name: "University of Michigan",
        location: "Ann Arbor, MI",
        type: "Public",
        ranking: 5,
        tuition: 51200,
        acceptanceRate: 20.2,
        description: "University of Michigan is a public research university in Ann Arbor, Michigan.",
        website: "https://www.umich.edu",
        image: "/images/michigan.jpg",
        programs: ["Engineering", "Business", "Medicine", "Liberal Arts"],
        requirements: {
            gpa: 3.6,
            sat: 1400,
            toefl: 85
        }
    }
];

// Initialize sample data
sampleColleges.forEach(college => {
    colleges.set(college.id, college);
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Routes

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'UniGuide.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/wizard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'wizard.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/colleges', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'college.html'));
});

app.get('/essays', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'essay.html'));
});

app.get('/tasks', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'task.html'));
});

app.get('/chat', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ChatUniGuide.html'));
});

app.get('/settings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Authentication APIs
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        for (let [id, user] of users) {
            if (user.email === email) {
                return res.status(400).json({ error: 'User already exists' });
            }
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const userId = Date.now();
        const user = {
            id: userId,
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        users.set(userId, user);
        req.session.userId = userId;
        
        res.json({ success: true, user: { id: userId, name, email } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        let user = null;
        for (let [id, u] of users) {
            if (u.email === email) {
                user = u;
                break;
            }
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        req.session.userId = user.id;
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// User Profile APIs
app.get('/api/user/profile', requireAuth, (req, res) => {
    const profile = userProfiles.get(req.session.userId) || {};
    res.json(profile);
});

app.post('/api/user/profile', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const profile = req.body;
    profile.userId = userId;
    profile.updatedAt = new Date();
    
    userProfiles.set(userId, profile);
    res.json({ success: true, profile });
});

// College APIs
app.get('/api/colleges', requireAuth, (req, res) => {
    const { search, type, location, minRanking, maxRanking } = req.query;
    let filteredColleges = Array.from(colleges.values());
    
    if (search) {
        filteredColleges = filteredColleges.filter(college => 
            college.name.toLowerCase().includes(search.toLowerCase()) ||
            college.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (type) {
        filteredColleges = filteredColleges.filter(college => 
            college.type.toLowerCase() === type.toLowerCase()
        );
    }
    
    if (location) {
        filteredColleges = filteredColleges.filter(college => 
            college.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    if (minRanking) {
        filteredColleges = filteredColleges.filter(college => 
            college.ranking >= parseInt(minRanking)
        );
    }
    
    if (maxRanking) {
        filteredColleges = filteredColleges.filter(college => 
            college.ranking <= parseInt(maxRanking)
        );
    }
    
    res.json(filteredColleges);
});

app.get('/api/colleges/:id', requireAuth, (req, res) => {
    const college = colleges.get(parseInt(req.params.id));
    if (!college) {
        return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
});

// College Notes APIs
app.get('/api/colleges/:id/notes', requireAuth, (req, res) => {
    const key = `${req.session.userId}-${req.params.id}`;
    const notes = collegeNotes.get(key) || { notes: '', tags: [] };
    res.json(notes);
});

app.post('/api/colleges/:id/notes', requireAuth, (req, res) => {
    const key = `${req.session.userId}-${req.params.id}`;
    const { notes, tags } = req.body;
    
    collegeNotes.set(key, {
        userId: req.session.userId,
        collegeId: parseInt(req.params.id),
        notes,
        tags: tags || [],
        updatedAt: new Date()
    });
    
    res.json({ success: true });
});

// AI Chat APIs
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, context } = req.body;
        const userId = req.session.userId;
        
        // Get user profile for context
        const userProfile = userProfiles.get(userId) || {};
        
        // Get chat history
        let history = chatHistory.get(userId) || [];
        
        // Prepare system prompt
        const systemPrompt = `You are UniGuide AI, a helpful college admissions counselor. 
        Help students with college selection, essay writing, and application planning.
        Always respond in a friendly, professional manner.
        
        User Profile: ${JSON.stringify(userProfile)}
        
        When recommending colleges, provide specific college cards in this format:
        COLLEGE_CARD: {
          "id": number,
          "name": "College Name",
          "location": "City, State",
          "ranking": number,
          "acceptanceRate": number,
          "description": "Brief description",
          "website": "https://college-website.edu"
        }`;
        
        // Create messages array
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10), // Keep last 10 messages for context
            { role: "user", content: message }
        ];
        
        // Get AI response
        const completion = await openai.chat.completions.create({
            messages,
            model: "deepseek-chat",
            temperature: 0.7,
            max_tokens: 1000
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        // Update chat history
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: aiResponse });
        chatHistory.set(userId, history);
        
        // Extract college cards if any
        const collegeCards = [];
        const cardPattern = /COLLEGE_CARD:\s*({[^}]+})/g;
        let match;
        while ((match = cardPattern.exec(aiResponse)) !== null) {
            try {
                const card = JSON.parse(match[1]);
                collegeCards.push(card);
            } catch (e) {
                console.error('Error parsing college card:', e);
            }
        }
        
        // Clean response (remove COLLEGE_CARD markers)
        const cleanResponse = aiResponse.replace(/COLLEGE_CARD:\s*{[^}]+}/g, '').trim();
        
        res.json({
            response: cleanResponse,
            collegeCards: collegeCards.length > 0 ? collegeCards : getRandomCollegeCards()
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// Get random college cards for responses
function getRandomCollegeCards() {
    const allColleges = Array.from(colleges.values());
    const shuffled = allColleges.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(college => ({
        id: college.id,
        name: college.name,
        location: college.location,
        ranking: college.ranking,
        acceptanceRate: college.acceptanceRate,
        description: college.description,
        website: college.website
    }));
}

// Essay APIs
app.get('/api/essays', requireAuth, (req, res) => {
    const userEssays = Array.from(essays.values()).filter(essay => essay.userId === req.session.userId);
    res.json(userEssays);
});

app.post('/api/essays', requireAuth, (req, res) => {
    const essay = {
        id: Date.now(),
        userId: req.session.userId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    essays.set(essay.id, essay);
    res.json(essay);
});

app.put('/api/essays/:id', requireAuth, (req, res) => {
    const essayId = parseInt(req.params.id);
    const essay = essays.get(essayId);
    
    if (!essay || essay.userId !== req.session.userId) {
        return res.status(404).json({ error: 'Essay not found' });
    }
    
    const updatedEssay = {
        ...essay,
        ...req.body,
        updatedAt: new Date()
    };
    
    essays.set(essayId, updatedEssay);
    res.json(updatedEssay);
});

// Task APIs
app.get('/api/tasks', requireAuth, (req, res) => {
    const userTasks = Array.from(tasks.values()).filter(task => task.userId === req.session.userId);
    res.json(userTasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
    const task = {
        id: Date.now(),
        userId: req.session.userId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    tasks.set(task.id, task);
    res.json(task);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);
    
    if (!task || task.userId !== req.session.userId) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    const updatedTask = {
        ...task,
        ...req.body,
        updatedAt: new Date()
    };
    
    tasks.set(taskId, updatedTask);
    res.json(updatedTask);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);
    
    if (!task || task.userId !== req.session.userId) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks.delete(taskId);
    res.json({ success: true });
});

// AI College Matching API
app.post('/api/ai/match-colleges', requireAuth, async (req, res) => {
    try {
        const userProfile = userProfiles.get(req.session.userId) || {};
        const { preferences } = req.body;
        
        // Simple matching algorithm based on user profile
        let matchedColleges = Array.from(colleges.values());
        
        // Filter by GPA requirements
        if (userProfile.gpa) {
            matchedColleges = matchedColleges.filter(college => 
                !college.requirements?.gpa || userProfile.gpa >= (college.requirements.gpa - 0.3)
            );
        }
        
        // Filter by test scores
        if (userProfile.satScore) {
            matchedColleges = matchedColleges.filter(college => 
                !college.requirements?.sat || userProfile.satScore >= (college.requirements.sat - 100)
            );
        }
        
        // Sort by match score
        matchedColleges = matchedColleges.map(college => ({
            ...college,
            matchScore: calculateMatchScore(college, userProfile, preferences)
        })).sort((a, b) => b.matchScore - a.matchScore);
        
        res.json(matchedColleges.slice(0, 10)); // Return top 10 matches
    } catch (error) {
        console.error('College matching error:', error);
        res.status(500).json({ error: 'Failed to match colleges' });
    }
});

// Simple match score calculation
function calculateMatchScore(college, userProfile, preferences) {
    let score = 100;
    
    // GPA match
    if (userProfile.gpa && college.requirements?.gpa) {
        const gpaDiff = Math.abs(userProfile.gpa - college.requirements.gpa);
        score -= gpaDiff * 20;
    }
    
    // Location preference
    if (preferences?.preferredLocation && 
        college.location.toLowerCase().includes(preferences.preferredLocation.toLowerCase())) {
        score += 20;
    }
    
    // Type preference
    if (preferences?.collegeType && 
        college.type.toLowerCase() === preferences.collegeType.toLowerCase()) {
        score += 15;
    }
    
    // Ranking bonus (higher ranking = higher score)
    score += (50 - college.ranking) * 2;
    
    return Math.max(0, score);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`UniGuide server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});