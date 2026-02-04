// interview.js

// ---------- CONFIGURATION ----------
const BACKEND_API_URL = '';
const STORAGE_KEY = 'ats_interview_data';
let currentQuestions = [];
let favorites = new Set();
let answeredQuestions = new Set();

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Interview Prep Initialized');
    
    // Initialize all components
    initThemeToggle();
    initMobileMenu();
    initEventListeners();
    loadFromLocalStorage();
    
    // Initialize animations
    initAnimations();
    
    // Load sample questions if none exist
    if (currentQuestions.length === 0) {
        loadSampleQuestions();
    }
});

// ---------- THEME MANAGEMENT ----------
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (!themeToggle) return;
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (mobileThemeToggle) mobileThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Theme toggle function
    function toggleTheme() {
        const isLight = document.body.classList.contains('light-mode');
        
        document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        
        if (isLight) {
            // Switch to dark mode
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            if (mobileThemeToggle) mobileThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            // Switch to light mode
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            if (mobileThemeToggle) mobileThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }
    
    // Add event listeners
    themeToggle.addEventListener('click', toggleTheme);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
}

// ---------- MOBILE MENU ----------
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!mobileMenuBtn || !mobileMenu) return;

    function openMenu() {
        mobileMenu.classList.remove('translate-x-full');
        document.body.classList.add('menu-open'); // Ye class piche ka content hide karegi
    }

    function closeMenu() {
        mobileMenu.classList.add('translate-x-full');
        document.body.classList.remove('menu-open');
    }

    mobileMenuBtn.addEventListener('click', openMenu);
    mobileCloseBtn?.addEventListener('click', closeMenu);
}

// ---------- ANIMATIONS ----------
// ---------- ANIMATIONS (Scroll Reveal) ----------
function initAnimations() {
    // 1. Sabhi important elements par class lagao
    const elementsToAnimate = document.querySelectorAll(
        '.glass-panel, .question-card, .text-center, .grid, h1, h2, .form-group'
    );
    
    elementsToAnimate.forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    // 2. Observer Setup
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px', // Thoda upar aane par trigger ho
        threshold: 0.1 // 10% element dikhne par animation start
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Ek baar hone ke baad dubara mat karo
            }
        });
    }, observerOptions);

    // 3. Start Observing
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ---------- EVENT LISTENERS ----------
 // ---------- EVENT LISTENERS (Mobile Optimized) ----------
function initEventListeners() {
    console.log('📱 Initializing Event Listeners...');

    // Helper to add safe listeners (Fixes mobile touch/click issues)
    const addSafeListener = (id, handler) => {
        const btn = document.getElementById(id);
        if (btn) {
            // Remove old listeners to prevent duplicates
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add click listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent double tap zoom etc.
                console.log(`🚀 Button Clicked: ${id}`);
                handler(e);
            });
            
            // Mobile specific touchstart safety
            newBtn.addEventListener('touchend', (e) => {
                // Optional: add logic if needed, but click usually suffices
            });
        } else {
            console.warn(`⚠️ Button not found: ${id}`);
        }
    };

    // 1. Attach listeners safely using helper
    addSafeListener('generateQuestionsBtn', generateInterviewQuestions);
    addSafeListener('generateAnswersBtn', generateSampleAnswers);
    addSafeListener('practiceModeBtn', openPracticeModal);
    addSafeListener('generateAnswerBtn', generateAIAnswer);
    addSafeListener('clearAnswerBtn', clearAnswer);
    addSafeListener('regenerateAnswerBtn', regenerateAnswer);
    addSafeListener('copyAnswerBtn', copyAnswerToClipboard);
    addSafeListener('saveAnswerBtn', saveAnswer);
    addSafeListener('speakAnswerBtn', toggleSpeech);
    
    // 2. Practice Modal Buttons
    addSafeListener('closePracticeModal', closePracticeModalFunc);
    addSafeListener('startPracticeBtn', startPractice);
    addSafeListener('nextPracticeBtn', nextPracticeQuestion);
    addSafeListener('stopPracticeBtn', stopPractice);
    initSpeechToText();

    // 3. Input Validation (Green Check Effect)
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if(this.value.trim().length > 2) {
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
            }
        });
    });

    // 4. Category Filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // Stop page jump
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('active', 'btn-primary-glow');
                b.classList.add('glass-panel', 'text-gray-300');
            });
            this.classList.remove('glass-panel', 'text-gray-300');
            this.classList.add('active', 'btn-primary-glow');
            const category = this.getAttribute('data-category');
            filterQuestions(category);
        });
    });

    // 5. Escape Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePracticeModalFunc();
    });

    // 6. Authentication buttons (Simple Alert)
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', () => showToast('Login feature coming soon!', 'info'));
    if (signupBtn) signupBtn.addEventListener('click', () => showToast('Signup feature coming soon!', 'info'));
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => showToast('Login feature coming soon!', 'info'));
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => showToast('Signup feature coming soon!', 'info'));
}

// ---------- AI INTERVIEW QUESTIONS ----------
async function generateInterviewQuestions() {
        // Function ke start mein:
showLoader(); // Ye global loader hai (optional, remove kar sakte ho agar skeleton use kar rahe ho)
document.getElementById('initialState')?.classList.add('hidden'); // Hide default text
document.getElementById('questionsSkeleton')?.classList.remove('hidden'); // Show Skeleton

// Function ke end mein (success/error block mein):
document.getElementById('questionsSkeleton')?.classList.add('hidden'); // Hide Skeleton


    const jobTitle = document.getElementById('jobTitleInput')?.value.trim();
    const jobDescription = document.getElementById('jobDescriptionInput')?.value.trim();
    const skills = document.getElementById('skillsInput')?.value.trim();
    
    if (!jobTitle) {
        showToast('Please enter a job title', 'error');
        return;
    }
    
    showLoader();
    
    try {
        const prompt = `Generate 10 interview questions for a ${jobTitle} position. 
        ${jobDescription ? `Job Description: ${jobDescription}` : ''}
        ${skills ? `Candidate Skills: ${skills}` : ''}
        
        Include a mix of:
        1. Technical questions (40%)
        2. Behavioral questions (30%)
        3. Situational questions (20%)
        4. HR questions (10%)
        
        Format the response as a JSON array with objects containing:
        - id: unique number
        - question: the interview question
        - type: one of ["technical", "behavioral", "situational", "hr"]
        - difficulty: one of ["easy", "medium", "hard"]
        - category: specific category (e.g., "Data Structures", "Leadership", "Problem Solving")
        
        Return ONLY the JSON array, no additional text.`;
        
        const response = await fetch(`${BACKEND_API_URL}/api/ai/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: "Interview Questions",
                job_title: jobTitle,
                technical_skills: skills,
                experience_count: 0,
                custom_prompt: prompt
            })
        });
        
        const result = await response.json();
        
        let questions;
        if (typeof result.summary === 'string') {
            try {
                // Clean the response
                let cleaned = result.summary.trim();
                if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
                if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
                if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
                
                questions = JSON.parse(cleaned);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                questions = generateFallbackQuestions(jobTitle, skills);
            }
        } else {
            questions = result.summary;
        }
        
        if (Array.isArray(questions)) {
            currentQuestions = questions;
            displayQuestions(questions);
            saveToLocalStorage();

            setTimeout(() => {
    document.getElementById('questionsContainer').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}, 100);
            updateStats();
            showToast('🎉 Interview questions generated successfully!');
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        console.error('AI Error:', error);
        currentQuestions = generateFallbackQuestions(jobTitle, skills);
        displayQuestions(currentQuestions);
        saveToLocalStorage();
        updateStats();
        showToast('Using fallback questions', 'info');
    } finally {
        hideLoader();
    }
}

function generateFallbackQuestions(jobTitle, skills) {
    const baseQuestions = [
        {
            id: 1,
            question: "Tell me about yourself and your experience with programming.",
            type: "behavioral",
            difficulty: "easy",
            category: "Introduction"
        },
        {
            id: 2,
            question: "What programming languages are you most comfortable with and why?",
            type: "technical",
            difficulty: "easy",
            category: "Technical Skills"
        },
        {
            id: 3,
            question: "Describe a challenging project you worked on and how you overcame obstacles.",
            type: "behavioral",
            difficulty: "medium",
            category: "Problem Solving"
        },
        {
            id: 4,
            question: "How do you handle tight deadlines and multiple priorities?",
            type: "situational",
            difficulty: "medium",
            category: "Time Management"
        },
        {
            id: 5,
            question: "Explain object-oriented programming in simple terms.",
            type: "technical",
            difficulty: "medium",
            category: "Technical Concepts"
        },
        {
            id: 6,
            question: "Where do you see yourself in 5 years?",
            type: "hr",
            difficulty: "easy",
            category: "Career Goals"
        },
        {
            id: 7,
            question: "How do you handle conflicts within a team?",
            type: "behavioral",
            difficulty: "medium",
            category: "Teamwork"
        },
        {
            id: 8,
            question: "What is your salary expectation for this role?",
            type: "hr",
            difficulty: "medium",
            category: "Compensation"
        },
        {
            id: 9,
            question: "How do you stay updated with the latest technologies?",
            type: "behavioral",
            difficulty: "easy",
            category: "Learning"
        },
        {
            id: 10,
            question: "Do you have any questions for us?",
            type: "hr",
            difficulty: "easy",
            category: "Closing"
        }
    ];
    
    // Customize questions based on job title
    const lowerTitle = jobTitle.toLowerCase();
    if (lowerTitle.includes('frontend') || lowerTitle.includes('react') || lowerTitle.includes('angular')) {
        baseQuestions[1].question = "What are the key differences between React and Angular?";
        baseQuestions[4].question = "Explain the Virtual DOM in React and its benefits.";
        baseQuestions[4].category = "Frontend Concepts";
    } else if (lowerTitle.includes('backend') || lowerTitle.includes('node') || lowerTitle.includes('python')) {
        baseQuestions[1].question = "What are the advantages of using Node.js for backend development?";
        baseQuestions[4].question = "Explain RESTful API design principles.";
        baseQuestions[4].category = "Backend Concepts";
    } else if (lowerTitle.includes('full stack') || lowerTitle.includes('full-stack')) {
        baseQuestions[1].question = "How do you manage state in a full-stack application?";
        baseQuestions[4].question = "Explain the differences between SQL and NoSQL databases.";
        baseQuestions[4].category = "Full Stack Concepts";
    }
    
    // Add skills to questions if provided
    if (skills) {
        const skillList = skills.split(',').slice(0,2).join(', ');
        baseQuestions[2].question = `Based on your skills in ${skillList}, describe a project where you applied these skills.`;
    }
    
    return baseQuestions;
}

function displayQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (questions.length === 0) {
        container.innerHTML = `
            <div class="md:col-span-2 text-center py-12">
                <div class="inline-block p-8 rounded-2xl glass-panel">
                    <i class="fas fa-comments text-4xl text-blue-400 mb-4"></i>
                    <h3 class="text-xl font-bold text-white mb-2">No Questions Yet</h3>
                    <p class="text-gray-400">Enter job details above and click "Generate Interview Questions" to get started</p>
                </div>
            </div>
        `;
        return;
    }
    
    questions.forEach((q, index) => {
        const questionCard = createQuestionCard(q, index);
        container.appendChild(questionCard);
    });
    
    // Show answer generator
    const answerGenerator = document.getElementById('answerGenerator');
    if (answerGenerator) {
        answerGenerator.classList.remove('hidden');
    }

    initAnimations();

}

function createQuestionCard(question, index) {
    const card = document.createElement('div');
    card.className = `question-card ${question.type} fade-in-up`;
    card.dataset.category = question.type;
    card.dataset.index = index;
    
    // Difficulty badge
    const difficultyClass = question.difficulty === 'easy' ? 'easy' : 
                           question.difficulty === 'medium' ? 'medium' : 'hard';
    
    // Check if favorited
    const isFavorited = favorites.has(question.id);
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2">
                <span class="question-tag ${question.type}">${question.type}</span>
                <span class="difficulty-badge ${difficultyClass}">${question.difficulty}</span>
            </div>
            <div class="flex gap-2">
                <button class="answer-btn px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs hover:scale-105 transition-transform duration-300" data-index="${index}">
                    <i class="fas fa-lightbulb mr-1"></i>Get Answer
                </button>
                <button class="favorite-btn px-3 py-1.5 rounded-lg glass-panel text-xs hover:bg-white/10 transition-all duration-300" data-id="${question.id}">
                    <i class="${isFavorited ? 'fas text-yellow-400' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <h3 class="font-semibold text-white mb-3 text-lg">${question.question}</h3>
        <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">${question.category}</span>
            <div class="text-xs text-gray-500">#${question.id}</div>
        </div>
    `;
    
    // Add event listeners
    const answerBtn = card.querySelector('.answer-btn');
    const favoriteBtn = card.querySelector('.favorite-btn');
    
    answerBtn.addEventListener('click', () => {
        setSelectedQuestion(question, index);
        scrollToAnswerGenerator();
    });
    
    favoriteBtn.addEventListener('click', function() {
        const questionId = parseInt(this.dataset.id);
        const icon = this.querySelector('i');
        
        if (favorites.has(questionId)) {
            favorites.delete(questionId);
            icon.classList.remove('fas', 'text-yellow-400');
            icon.classList.add('far');
            showToast('Removed from favorites');
        } else {
            favorites.add(questionId);
            icon.classList.remove('far');
            icon.classList.add('fas', 'text-yellow-400');
            showToast('Added to favorites');
        }
        
        saveToLocalStorage();
        updateStats();
    });
    
    return card;
}

function filterQuestions(category) {
    const questions = document.querySelectorAll('.question-card');
    
    questions.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ---------- AI ANSWER GENERATOR ----------
async function generateAIAnswer() {
    const question = document.getElementById('selectedQuestion')?.textContent;
    const context = document.getElementById('answerContext')?.value.trim();
    const jobTitle = document.getElementById('jobTitleInput')?.value.trim();
    const skills = document.getElementById('skillsInput')?.value.trim();
    
    if (!question || question === 'Select a question to generate answer') {
        showToast('Please select a question first', 'error');
        return;
    }
    
    showLoader('answer');
    
    try {
        const prompt = `Generate a professional answer for this interview question:
        
        QUESTION: ${question}
        
        ${context ? `CANDIDATE CONTEXT: ${context}` : ''}
        ${jobTitle ? `JOB TITLE: ${jobTitle}` : ''}
        ${skills ? `CANDIDATE SKILLS: ${skills}` : ''}
        
        Requirements:
        1. Provide a structured answer with clear points
        2. Include relevant examples or experiences
        3. Keep it professional and confident
        4. Tailor it to the job role if relevant
        5. Limit to 150-200 words
        
        Format the response as a well-structured paragraph with bullet points if needed.`;
        
        const response = await fetch(`${BACKEND_API_URL}/api/ai/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: "Interview Answer",
                job_title: jobTitle || "Candidate",
                technical_skills: skills || "",
                experience_count: 0,
                custom_prompt: prompt
            })
        });
        
        const result = await response.json();
        
        let answer;
        if (typeof result.summary === 'string') {
            answer = result.summary;
        } else {
            answer = JSON.stringify(result.summary);
        }
        
        displayAIAnswer(answer);
        showToast('✅ AI answer generated successfully!');
        
    } catch (error) {
        console.error('AI Error:', error);
        const fallbackAnswer = generateFallbackAnswer(question, context, jobTitle, skills);
        displayAIAnswer(fallbackAnswer);
        showToast('Using fallback answer', 'info');
    } finally {
        hideLoader();
    }
}

function generateFallbackAnswer(question, context, jobTitle, skills) {
    let answer = `Here's a professional approach to answer this question:\n\n`;
    
    if (question.toLowerCase().includes('tell me about yourself')) {
        answer += `Start with a brief professional summary, highlight relevant experience, mention key skills, and conclude with your career goals. For example: "I'm a passionate ${jobTitle || 'professional'} with experience in ${skills || 'relevant technologies'}. In my previous role, I focused on [mention key achievements]. I'm excited about this opportunity because..."`;
    }
    else if (question.toLowerCase().includes('strengths') || question.toLowerCase().includes('weakness')) {
        answer += `For strengths: Mention 2-3 relevant skills with examples. For weaknesses: Choose a real area of improvement and show how you're working on it. Example: "One area I'm improving is public speaking, so I've joined Toastmasters and practice regularly."`;
    }
    else if (question.toLowerCase().includes('challeng') || question.toLowerCase().includes('problem')) {
        answer += `Use the STAR method: Situation (describe context), Task (your responsibility), Action (steps you took), Result (outcomes achieved). Quantify results when possible: "I improved efficiency by 30% by implementing..."`;
    }
    else if (question.toLowerCase().includes('salary')) {
        answer += `Research market rates for this role in your location. Provide a range based on your experience: "Based on my experience and market research, I'm looking for a package in the range of [reasonable range]. However, I'm flexible and more interested in the right opportunity."`;
    }
    else {
        answer += `Structure your answer with: 1) Clear thesis statement, 2) Supporting points with examples, 3) Connection to the role. Draw from your experience: ${context || 'Think about relevant projects or situations'}. Relate it to how you can contribute to this company.`;
    }
    
    if (context) {
        answer += `\n\nIncorporate your experience: ${context}`;
    }
    
    return answer;
}

function displayAIAnswer(answer) {
    const answerContent = document.getElementById('answerContent');
    const aiAnswer = document.getElementById('aiAnswer');
    
    if (answerContent && aiAnswer) {
        // Prepare HTML (Formatting logic same as before)
        let formattedAnswer = answer
            .replace(/\n/g, '<br>')
            .replace(/\*\s+(.+?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/(key takeaway|important|crucial|essential)/gi, '<strong class="text-blue-300">$1</strong>');
            
        if (formattedAnswer.includes('<li>')) {
            formattedAnswer = formattedAnswer.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-5 my-2">$1</ul>');
        }
        
        // Show container
        aiAnswer.classList.remove('hidden');
        answerContent.innerHTML = ''; // Clear existing
        
        // Typewriter Logic
        let i = 0;
        const speed = 5; // Typing speed (lower is faster)
        
        // Temporarily create a div to parse HTML tags correctly (advanced typing)
        // Simple typing approach:
        answerContent.innerHTML = '<span class="typing-cursor">|</span>';
        
        // For rich HTML typing, it's complex. Let's do a Fade-In Word by Word effect which is safer for HTML
        const words = formattedAnswer.split(' ');
        let currentHTML = '';
        
        const typeInterval = setInterval(() => {
            if (i < words.length) {
                currentHTML += words[i] + ' ';
                answerContent.innerHTML = currentHTML;
                i++;
                // Auto scroll to bottom while typing
                answerContent.scrollTop = answerContent.scrollHeight;
            } else {
                clearInterval(typeInterval);
            }
        }, 20); // Adjust speed here
    }
    
    // Update stats...
    const selectedIndex = document.getElementById('selectedQuestion')?.dataset.index;
    if (selectedIndex !== undefined) {
        answeredQuestions.add(parseInt(selectedIndex));
        updateStats();
    }

    setTimeout(() => {
    document.getElementById('answerGenerator').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}, 100);
    
}

function setSelectedQuestion(question, index) {
    const selectedQuestionEl = document.getElementById('selectedQuestion');
    if (selectedQuestionEl) {
        selectedQuestionEl.textContent = question.question;
        selectedQuestionEl.dataset.index = index;
        selectedQuestionEl.classList.add('font-semibold');
    }
    
    // Clear previous answer
    const aiAnswer = document.getElementById('aiAnswer');
    if (aiAnswer) {
        aiAnswer.classList.add('hidden');
    }
    
    // Focus on context textarea
    const answerContext = document.getElementById('answerContext');
    if (answerContext) {
        answerContext.focus();
    }
}

function scrollToAnswerGenerator() {
    const answerGenerator = document.getElementById('answerGenerator');
    if (answerGenerator) {
        answerGenerator.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ---------- SAMPLE ANSWERS ----------
async function generateSampleAnswers() {
    const jobTitle = document.getElementById('jobTitleInput')?.value.trim();
    
    if (!jobTitle) {
        showToast('Please enter a job title first', 'error');
        return;
    }
    
    showLoader();
    
    try {
        // Generate common questions with answers
        const commonQuestions = [
            {
                id: 101,
                question: "Tell me about yourself",
                type: "behavioral",
                difficulty: "easy",
                category: "Introduction",
                answer: `I'm a ${jobTitle} with experience in delivering high-quality solutions. My background includes working on [specific projects], and I'm particularly skilled in [relevant skills]. I'm passionate about [industry-specific interest] and I'm excited about this opportunity because [reason specific to company].`
            },
            {
                id: 102,
                question: "Why do you want to work here?",
                type: "hr",
                difficulty: "medium",
                category: "Motivation",
                answer: `I've been following your company's work in [specific area] and I'm impressed by [specific achievement or project]. Your commitment to [company value] aligns with my own professional values. I believe my skills in [relevant skills] would allow me to contribute to [specific team or project].`
            },
            {
                id: 103,
                question: "What are your greatest strengths?",
                type: "behavioral",
                difficulty: "easy",
                category: "Self-assessment",
                answer: `My key strengths are problem-solving, collaboration, and technical proficiency. For example, I recently [specific example of problem-solving]. I'm also an effective team player who [example of collaboration]. Technically, I excel in [specific technical skills].`
            }
        ];
        
        // Display as questions
        currentQuestions = commonQuestions;
        displayQuestions(commonQuestions);
        
        // Set first question as selected
        if (commonQuestions.length > 0) {
            setSelectedQuestion(commonQuestions[0], 0);
        }
        
        showToast('Sample answers generated successfully!');
        
    } catch (error) {
        console.error('Error generating sample answers:', error);
        showToast('Failed to generate sample answers', 'error');
    } finally {
        hideLoader();
    }
}

// ---------- PRACTICE MODE ----------
let practiceTimer = null;
let practiceTime = 120; // 2 minutes in seconds
let currentPracticeIndex = 0;

function openPracticeModal() {
    if (currentQuestions.length === 0) {
        showToast('Generate questions first', 'error');
        return;
    }
    
    const modal = document.getElementById('practiceModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        resetPractice();
        loadPracticeQuestion();
    }
}

function closePracticeModalFunc() {
    const modal = document.getElementById('practiceModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        stopPractice();
    }
}

function startPractice() {
    if (practiceTimer) return;
    
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    if (startPracticeBtn) {
        startPracticeBtn.disabled = true;
        startPracticeBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Practice Running';
    }
    
    practiceTimer = setInterval(() => {
        practiceTime--;
        updateTimer();
        
        if (practiceTime <= 0) {
            stopPractice();
            showToast('Time\'s up! Great practice session.', 'info');
        }
    }, 1000);
}

function stopPractice() {
    if (practiceTimer) {
        clearInterval(practiceTimer);
        practiceTimer = null;
    }
    
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    if (startPracticeBtn) {
        startPracticeBtn.disabled = false;
        startPracticeBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Practice';
    }
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        const minutes = Math.floor(practiceTime / 60);
        const seconds = practiceTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Color coding based on time
        if (practiceTime <= 30) {
            timerElement.classList.remove('text-white');
            timerElement.classList.add('text-red-400');
        } else if (practiceTime <= 60) {
            timerElement.classList.remove('text-white', 'text-red-400');
            timerElement.classList.add('text-yellow-400');
        }
    }
}

function resetPractice() {
    practiceTime = 120;
    currentPracticeIndex = 0;
    updateTimer();
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.classList.remove('text-red-400', 'text-yellow-400');
        timerElement.classList.add('text-white');
    }
    
    const practiceAnswer = document.getElementById('practiceAnswer');
    if (practiceAnswer) {
        practiceAnswer.value = '';
    }
}

function loadPracticeQuestion() {
    if (currentQuestions.length === 0) return;
    
    const practiceQuestion = document.getElementById('practiceQuestion');
    if (practiceQuestion) {
        practiceQuestion.textContent = currentQuestions[currentPracticeIndex].question;
    }
}

function nextPracticeQuestion() {
    if (currentQuestions.length === 0) return;
    
    currentPracticeIndex = (currentPracticeIndex + 1) % currentQuestions.length;
    loadPracticeQuestion();
    
    const practiceAnswer = document.getElementById('practiceAnswer');
    if (practiceAnswer) {
        practiceAnswer.value = '';
        practiceAnswer.focus();
    }
    
    // Mark question as answered
    answeredQuestions.add(currentPracticeIndex);
    updateStats();
    showToast('Question marked as practiced!', 'success');
}

// ---------- ANSWER MANAGEMENT ----------
function clearAnswer() {
    const answerContext = document.getElementById('answerContext');
    const aiAnswer = document.getElementById('aiAnswer');
    
    if (answerContext) answerContext.value = '';
    if (aiAnswer) aiAnswer.classList.add('hidden');
    
    showToast('Answer cleared');
}

function regenerateAnswer() {
    generateAIAnswer();
}

async function copyAnswerToClipboard() {
    const answerContent = document.getElementById('answerContent');
    const copyBtn = document.getElementById('copyAnswerBtn'); // Button ID pakdo
    const originalIcon = copyBtn.innerHTML; // Purana icon save karo (<i class="fas fa-copy"></i>)
    
    if (!answerContent) return;
    
    try {
        const text = answerContent.innerText || answerContent.textContent;
        await navigator.clipboard.writeText(text);
        
        // 1. Change Icon & Color
        copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
        copyBtn.classList.remove('from-green-500', 'to-emerald-600'); // Remove gradient
        copyBtn.classList.add('bg-green-600', 'scale-105'); // Add solid green & pop effect
        
        showToast('Answer copied to clipboard!');

        // 2. Revert back after 2 seconds
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
            copyBtn.classList.add('from-green-500', 'to-emerald-600'); // Restore gradient
            copyBtn.classList.remove('bg-green-600', 'scale-105');
        }, 2000);

    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy answer', 'error');
    }
}

function saveAnswer() {
    const selectedQuestion = document.getElementById('selectedQuestion')?.textContent;
    const answerContent = document.getElementById('answerContent')?.innerHTML;
    
    if (!selectedQuestion || !answerContent) {
        showToast('No answer to save', 'error');
        return;
    }
    
    // Get saved answers from localStorage
    const savedAnswers = JSON.parse(localStorage.getItem('interview_answers') || '[]');
    
    // Add new answer
    savedAnswers.push({
        question: selectedQuestion,
        answer: answerContent,
        timestamp: new Date().toISOString()
    });
    
    // Save back to localStorage
    localStorage.setItem('interview_answers', JSON.stringify(savedAnswers));
    
    showToast('Answer saved successfully!');
}

// ---------- STATISTICS ----------
function updateStats() {
    const totalQuestions = currentQuestions.length;
    const answeredCount = answeredQuestions.size;
    const favoritesCount = favorites.size;
    
    // Calculate practice score (answered questions / total questions)
    const practiceScore = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    
    // Update DOM elements
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const answeredCountEl = document.getElementById('answeredCount');
    const favoritesCountEl = document.getElementById('favoritesCount');
    const practiceScoreEl = document.getElementById('practiceScore');
    
    if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
    if (answeredCountEl) answeredCountEl.textContent = answeredCount;
    if (favoritesCountEl) favoritesCountEl.textContent = favoritesCount;
    if (practiceScoreEl) practiceScoreEl.textContent = `${practiceScore}%`;
}

// ---------- LOADING & TOASTS ----------
// Global variable for loader interval
let loaderInterval;

function showLoader(type = 'questions') {
    const loader = document.getElementById('globalLoader');
    const messageEl = loader.querySelector('.text-gray-400');
    const titleEl = loader.querySelector('.text-white');
    
    if (loader) {
        loader.classList.remove('hidden');
        
        // Clear previous intervals if any
        if(loaderInterval) clearInterval(loaderInterval);

        let steps = [];
        let title = "";

        if (type === 'answer') {
            // SCENARIO 1: Generating Answer
            title = "AI Interview Coach";
            steps = [
                "Understanding your question... 🤔",
                "Analyzing key points... 🧠",
                "Structuring the best answer... ✍️",
                "Polishing the response... ✨",
                "Almost there... 🚀"
            ];
        } else {
            // SCENARIO 2: Generating Questions (Default)
            title = "AI Recruiter";
            steps = [
                "Scanning Job Description... 🔍",
                "Identifying Required Skills... 🎯",
                "Curating Interview Questions... 📝",
                "Adjusting Difficulty Levels... ⚖️",
                "Finalizing List... ✅"
            ];
        }
        
        // Initial State
        titleEl.textContent = title;
        messageEl.textContent = steps[0];
        
        let i = 0;
        
        // Cycle through messages every 1.5 seconds
        loaderInterval = setInterval(() => {
            i = (i + 1) % steps.length;
            messageEl.textContent = steps[i];
        }, 1500);
    }
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.add('hidden');
        if(loaderInterval) clearInterval(loaderInterval); // Stop cycle
    }
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // --- FIX START: Changed 'bottom-6' to 'bottom-24 md:bottom-6' ---
    let baseClasses = 'fixed bottom-24 md:bottom-6 right-6 text-white px-6 py-4 rounded-xl shadow-xl transform translate-x-full transition-transform duration-500 z-[110]';
    // --- FIX END ---

    // Add type-specific colors
    if (type === 'success') {
        toast.className = `${baseClasses} bg-gradient-to-r from-green-500 to-emerald-600`;
    } else if (type === 'error') {
        toast.className = `${baseClasses} bg-gradient-to-r from-red-500 to-pink-600`;
    } else if (type === 'info') {
        toast.className = `${baseClasses} bg-gradient-to-r from-blue-500 to-cyan-600`;
    } else if (type === 'warning') {
        toast.className = `${baseClasses} bg-gradient-to-r from-yellow-500 to-orange-600`;
    }
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

// ---------- LOCAL STORAGE ----------
function saveToLocalStorage() {
    const data = {
        currentQuestions,
        favorites: Array.from(favorites),
        answeredQuestions: Array.from(answeredQuestions),
        lastUpdated: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        
        if (data) {
            currentQuestions = data.currentQuestions || [];
            favorites = new Set(data.favorites || []);
            answeredQuestions = new Set(data.answeredQuestions || []);
            
            // Update UI
            if (currentQuestions.length > 0) {
                displayQuestions(currentQuestions);
            }
            updateStats();
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
}

// ---------- SAMPLE DATA ----------
function loadSampleQuestions() {
    const sampleQuestions = [
        {
            id: 1,
            question: "What programming languages are you most proficient in and why?",
            type: "technical",
            difficulty: "medium",
            category: "Technical Skills"
        },
        {
            id: 2,
            question: "Describe a time when you had to meet a tight deadline. How did you handle it?",
            type: "behavioral",
            difficulty: "medium",
            category: "Time Management"
        },
        {
            id: 3,
            question: "How would you handle a situation where a team member is not contributing equally?",
            type: "situational",
            difficulty: "hard",
            category: "Teamwork"
        },
        {
            id: 4,
            question: "What are your salary expectations for this role?",
            type: "hr",
            difficulty: "medium",
            category: "Compensation"
        },
        {
            id: 5,
            question: "Explain the concept of RESTful APIs to a non-technical person.",
            type: "technical",
            difficulty: "hard",
            category: "Technical Concepts"
        }
    ];
    
    currentQuestions = sampleQuestions;
    displayQuestions(sampleQuestions);
    updateStats();
}

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', (e) => {
    // Ctrl+G to generate questions
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        generateInterviewQuestions();
    }
    
    // Ctrl+P to open practice mode
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        openPracticeModal();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closePracticeModalFunc();
    }
});

// ---------- EXPORT FUNCTIONS (for testing) ----------
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateInterviewQuestions,
        generateAIAnswer,
        updateStats,
        showToast,
        hideLoader,
        showLoader
    };
}

// ---------- TEXT TO SPEECH (SPEAKER) ----------
let speechUtterance = null; // Store current speech object

function toggleSpeech() {
    const btn = document.getElementById('speakAnswerBtn');
    const content = document.getElementById('answerContent');
    const icon = btn.querySelector('i');
    
    if (!content) return;

    // Agar already bol raha hai to STOP karo
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        
        // Reset Icon
        btn.innerHTML = '<i class="fas fa-volume-up mr-1"></i>Listen';
        btn.classList.remove('bg-pink-500/20', 'text-white');
        btn.classList.add('text-pink-400');
        return;
    }

    // Naya Speech Shuru karo
    const text = content.innerText || content.textContent;
    speechUtterance = new SpeechSynthesisUtterance(text);
    
    // Voice Settings (Optional: Try to pick a good English voice)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.lang.includes('en-US') && voice.name.includes('Google')) || voices[0];
    if (preferredVoice) speechUtterance.voice = preferredVoice;

    speechUtterance.rate = 1;  // Normal speed
    speechUtterance.pitch = 1; // Normal pitch

    // Jab bolna khatam ho jaye to button reset karo
    speechUtterance.onend = () => {
        btn.innerHTML = '<i class="fas fa-volume-up mr-1"></i>Listen';
        btn.classList.remove('bg-pink-500/20', 'text-white');
        btn.classList.add('text-pink-400');
    };

    // Error handling
    speechUtterance.onerror = () => {
        showToast('Speech failed. Try a different browser.', 'error');
        window.speechSynthesis.cancel();
    };

    // Update Button Style (Active State)
    btn.innerHTML = '<i class="fas fa-stop mr-1"></i>Stop';
    btn.classList.remove('text-pink-400');
    btn.classList.add('bg-pink-500/20', 'text-white');

    // Speak
    window.speechSynthesis.speak(speechUtterance);
}

// ---------- SPEECH TO TEXT (PRACTICE MODE) ----------
let recognition = null;
let isRecording = false;

function initSpeechToText() {
    // Check Browser Support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn("Speech recognition not supported in this browser.");
        const btn = document.getElementById('practiceMicBtn');
        if(btn) btn.style.display = 'none'; // Hide if not supported
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep recording even if user pauses
    recognition.interimResults = true; // Show text while speaking
    recognition.lang = 'en-US'; // Default Language

    const micBtn = document.getElementById('practiceMicBtn');
    const textarea = document.getElementById('practiceAnswer');

    if (!micBtn || !textarea) return;

    // Toggle Recording
    micBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // On Start
    recognition.onstart = () => {
        isRecording = true;
        micBtn.innerHTML = '<i class="fas fa-stop animate-pulse text-red-500"></i>';
        micBtn.classList.add('border-red-500', 'bg-red-500/10');
        textarea.placeholder = "Listening... Speak now...";
    };

    // On End
    recognition.onend = () => {
        isRecording = false;
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.classList.remove('border-red-500', 'bg-red-500/10');
        textarea.placeholder = "Type or speak your answer here...";
        
        // Auto restart if user didn't stop it manually (optional, for long answers)
        // if (shouldContinue) recognition.start(); 
    };

    // On Result (Typing...)
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Logic to append text correctly
        // Hum current value + new text add karenge
        // Note: Real-time update ke liye thoda complex logic lagta hai, 
        // par ye simple approach "Final" text ko append karega.
        
        if (finalTranscript) {
            // Add space if needed
            const currentVal = textarea.value;
            const prefix = currentVal && !currentVal.endsWith(' ') ? ' ' : '';
            textarea.value = currentVal + prefix + finalTranscript;
            
            // Auto scroll to bottom
            textarea.scrollTop = textarea.scrollHeight;
        }
    };

    // Handle Errors
    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        if (event.error === 'not-allowed') {
            showToast('Please allow microphone access', 'error');
        }
        recognition.stop();
    };
}

// ==========================================
// MOBILE BOTTOM NAV LOGIC (Universal)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Highlight Active Tab based on URL
    const currentPath = window.location.pathname;
    const bottomLinks = document.querySelectorAll('.bottom-nav-item');
    
    bottomLinks.forEach(link => {
        // Check if link's href matches current path
        // (link.getAttribute('href') checks the relative path like '/builder')
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.classList.remove('text-gray-400');
        }
    });

    // 2. Bottom Bar Theme Toggle Logic
    const bottomThemeBtn = document.getElementById('bottomThemeToggle');
    
    if(bottomThemeBtn) {
        // Sync icon with current theme
        const updateBottomIcon = () => {
            const isLight = document.body.classList.contains('light-mode');
            const icon = bottomThemeBtn.querySelector('i');
            const text = bottomThemeBtn.querySelector('span');
            
            if(isLight) {
                icon.className = 'fas fa-moon mb-1'; // Show Moon in Light Mode
                icon.style.color = '#3b82f6'; // Blue moon
            } else {
                icon.className = 'fas fa-sun mb-1'; // Show Sun in Dark Mode
                icon.style.color = '#fbbf24'; // Yellow sun
            }
        };

        // Initial check
        updateBottomIcon();

        // Click Handler (Uses your existing toggleTheme function if available, else manual)
        bottomThemeBtn.addEventListener('click', () => {
            // Try clicking the main desktop toggle to keep logic synced
            const mainToggle = document.getElementById('themeToggle');
            if(mainToggle) {
                mainToggle.click();
            } else {
                // Fallback manual toggle
                document.body.classList.toggle('light-mode');
                const isLight = document.body.classList.contains('light-mode');
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            }
            // Update icon after toggle
            setTimeout(updateBottomIcon, 50); 
        });
        
        // Listen for global theme changes (if main toggle is clicked elsewhere)
        const observer = new MutationObserver(updateBottomIcon);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
});