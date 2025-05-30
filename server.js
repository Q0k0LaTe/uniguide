const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const OpenAI = require('openai');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGO_URI = "mongodb+srv://q0k0lates:NH6zWhnlkMwX5AEa@uniguide.kqkkinv.mongodb.net/?retryWrites=true&w=majority&appName=UniGuide";
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas (example for User, expand as needed)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    invitationCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// College Schema
const CollegeSchema = new mongoose.Schema({
    // Define fields based on sampleColleges and potential future needs
    name: { type: String, required: true },
    location: String,
    type: String,
    ranking: Number,
    tuition: Number,
    acceptanceRate: Number,
    description: String,
    website: String,
    image: String,
    programs: [String],
    requirements: {
        gpa: Number,
        sat: Number,
        toefl: Number
    }
});
const College = mongoose.model('College', CollegeSchema);

// UserProfile Schema
const UserProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Example fields, expand based on settings.html
    academicInterests: [String],
    safetySchools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
    targetSchools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
    reachSchools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'College' }],
    // Add other preferences from wizard/settings
    preferredLocation: String,
    majorPreference: String,
    extracurriculars: [String],
    profilePic: String // URL to image
});
const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

// CollegeNote Schema
const CollegeNoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    notes: String,
    pros: [String],
    cons: [String],
    rating: Number, // e.g., 1-5 stars
    lastUpdated: { type: Date, default: Date.now }
});
const CollegeNote = mongoose.model('CollegeNote', CollegeNoteSchema);

// Essay Schema
const EssaySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    prompt: String,
    content: String,
    status: { type: String, enum: ['Not Started', 'Drafting', 'Reviewing', 'Completed'], default: 'Not Started' },
    dueDate: Date,
    collegeApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'College' }, // Optional link to a specific college
    lastUpdated: { type: Date, default: Date.now }
});
const Essay = mongoose.model('Essay', EssaySchema);

// Task Schema
const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    description: String,
    dueDate: Date,
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    completed: { type: Boolean, default: false },
    collegeSpecific: { type: mongoose.Schema.Types.ObjectId, ref: 'College' }, // Optional link to a college
    category: String, // e.g., 'Application', 'Financial Aid', 'Recommendation Letter'
    lastUpdated: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// ChatMessage Schema (for ChatHistory)
const ChatMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    message: String,
    timestamp: { type: Date, default: Date.now },
    // Optional: context, session ID if you want to group conversations
    conversationId: String 
});
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

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

// Remove In-memory databases 
// const users = new Map();
// const colleges = new Map();
// const userProfiles = new Map();
// const collegeNotes = new Map();
// const essays = new Map();
// const tasks = new Map();
// const chatHistory = new Map();

// Sample college data - This could be moved to MongoDB as well
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

// Initialize sample data - If using MongoDB, this would be an initial data seeding script
// sampleColleges.forEach(college => {
//     colleges.set(college.id, college);
// });

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

app.get('/dashboard', requireAuth, (req, res) => { // This route might be deprecated if UniGuide.html is the dashboard
    res.sendFile(path.join(__dirname, 'public', 'UniGuide.html')); // Or redirect to /
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

app.get('/legal', (req, res) => { // Added route for legal.html
    res.sendFile(path.join(__dirname, 'public', 'legal.html'));
});

// Authentication APIs
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, invitationCode } = req.body;

        // TODO: Add a list of valid invitation codes, or a system to generate/check them
        // For now, let's assume a hardcoded valid code for demonstration
        const VALID_INVITATION_CODE = "UniGuide2024"; // Replace with your actual logic
        if (invitationCode !== VALID_INVITATION_CODE) {
            return res.status(400).json({ error: 'Invalid invitation code.' });
        }

        let existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            invitationCode
        });
        
        const savedUser = await newUser.save();
        req.session.userId = savedUser._id; // Use MongoDB's _id
        
        res.json({ success: true, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        req.session.userId = user._id; // Set session
        // Redirect to dashboard upon successful login
        res.redirect('/dashboard.html');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Default session cookie name, adjust if different
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check auth status API
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        // Optionally, you could fetch the user here to return more info if needed
        res.json({ isLoggedIn: true, userId: req.session.userId });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// User Profile APIs (Settings)
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.session.userId }).populate('safetySchools targetSchools reachSchools');
        if (!profile) {
            // If no profile, return a default structure or 204 No Content, or an empty object 
            // to make it easier for the frontend to handle.
            return res.json({ /* defaults or empty if preferred */ }); 
        }
        res.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/api/profile', requireAuth, async (req, res) => {
    try {
        const profileData = { ...req.body, userId: req.session.userId };
        // Ensure school lists are arrays of ObjectIds if provided
        if (profileData.safetySchools) profileData.safetySchools = profileData.safetySchools.map(id => new mongoose.Types.ObjectId(id));
        if (profileData.targetSchools) profileData.targetSchools = profileData.targetSchools.map(id => new mongoose.Types.ObjectId(id));
        if (profileData.reachSchools) profileData.reachSchools = profileData.reachSchools.map(id => new mongoose.Types.ObjectId(id));

        const profile = await UserProfile.findOneAndUpdate({ userId: req.session.userId }, profileData, { new: true, upsert: true, runValidators: true });
        res.json({ success: true, profile });
    } catch (error) {
        console.error("Error updating profile:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// API for Colleges (initial setup, can be expanded)
// Seed colleges if DB is empty (example - run once or use a dedicated script)
async function seedColleges() {
    try {
        const count = await College.countDocuments();
        if (count === 0 && sampleColleges && sampleColleges.length > 0) {
            console.log('Seeding colleges to database...');
            await College.insertMany(sampleColleges.map(c => ({...c, _id: undefined, id: undefined }))); // remove temporary frontend id
            console.log('Colleges seeded successfully.');
        }
    } catch (error) {
        console.error('Error seeding colleges:', error);
    }
}
// Call it once on server start if you want to auto-seed.
// Consider if this is the best place or if a separate script is better.
// seedColleges(); 

app.get('/api/colleges', async (req, res) => {
    try {
        const collegesList = await College.find({});
        res.json(collegesList);
    } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).json({ error: 'Failed to fetch colleges' });
    }
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