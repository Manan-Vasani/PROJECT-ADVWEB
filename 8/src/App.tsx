import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RouteFallback } from './components/RouteFallback';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { getStoredUser, getCurrentUser, logoutUser } from './services/api';
import type { User } from './services/api';
import './App.css';

// -------------------------------------------------------------
// Practical 8: Route-Based Code Splitting via React.lazy()
// Chunks downloaded asynchronously on-demand only when route is visited
// -------------------------------------------------------------
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Verify stored session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('itue301_p7_token');
    if (token) {
      getCurrentUser()
        .then((res) => {
          if (res?.user) setCurrentUser(res.user);
        })
        .catch(() => {
          logoutUser();
          setCurrentUser(null);
        });
    }

    // Listen for 401 Unauthorized event from api service
    const handleAuthExpired = () => {
      logoutUser();
      setCurrentUser(null);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Student portfolio dataset passed down to components via props
  const studentData = {
    personal: {
      name: "MANAN VASANI",
      title: "Aspiring Software Engineer & Web Developer",
      tagline: "I build robust, elegant, and user-centric web applications. Currently studying Computer Science & Engineering and collaborating on open-source projects."
    },
    about: {
      bio: "I am a student of Computer Science & Engineering (CSE) at Charusat University with a passion for frontend engineering and modern web technologies. I enjoy bridging the gap between design and development to build websites that look stunning and perform flawlessly.",
      interests: [
        "React & TypeScript Development",
        "Code Splitting & Performance Optimization",
        "Node.js & Express RESTful APIs",
        "UI/UX Visual Design",
        "Middleware Architecture & Systems",
        "Responsive & Accessible Web Development"
      ],
      education: [
        {
          degree: "B.Tech in Computer Science & Engineering (CSE)",
          institution: "Charusat University",
          period: "2023 - Present"
        }
      ]
    },
    skills: [
      // Frontend
      { name: "React (Lazy Loading & Suspense)", category: "Frontend", level: "Advanced", percentage: 92 },
      { name: "TypeScript", category: "Frontend", level: "Advanced", percentage: 85 },
      { name: "HTML5 / CSS3 (Sass)", category: "Frontend", level: "Expert", percentage: 95 },
      { name: "Next.js / Vite", category: "Frontend", level: "Intermediate", percentage: 80 },
      
      // Backend / Databases
      { name: "Node.js (Express)", category: "Backend & Systems", level: "Advanced", percentage: 88 },
      { name: "JWT Auth & Middleware", category: "Backend & Systems", level: "Advanced", percentage: 90 },
      { name: "MongoDB & Mongoose", category: "Backend & Systems", level: "Intermediate", percentage: 85 },
      
      // Developer Tools & Design
      { name: "Chrome DevTools & Profiler", category: "Tools & Design", level: "Advanced", percentage: 90 },
      { name: "Git & GitHub", category: "Tools & Design", level: "Advanced", percentage: 90 },
      { name: "Figma", category: "Tools & Design", level: "Intermediate", percentage: 80 }
    ],
    contact: {
      email: "mananvasani801@gmail.com",
      githubUrl: "https://github.com/JHON-WICK-007",
      linkedinUrl: "https://www.linkedin.com/in/manan-vasani-8b2213350",
      copyright: `© ${new Date().getFullYear()} MANAN VASANI. All rights reserved.`
    }
  };

  return (
    <div className="portfolio-container">
      {/* 1. NavBar - Persistent Navigation with React Router Links & Auth Pill */}
      <NavBar
        name={studentData.personal.name}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* 2. Practical 8 Performance Monitor Bar */}
      <PerformanceMonitor currentRoute={location.pathname} />
      
      {/* 3. Routes Wrapper - Wrapped with React <Suspense> for Lazy Loading */}
      <main>
        <Suspense fallback={<RouteFallback routeName={location.pathname} />}>
          <Routes>
            <Route path="/" element={<Home studentData={studentData} />} />
            <Route path="/projects" element={<Projects />} />
            <Route
              path="/tasks"
              element={
                <Tasks
                  currentUser={currentUser}
                  onOpenAuth={(mode) => {
                    setAuthModalMode(mode || 'login');
                    setIsAuthModalOpen(true);
                  }}
                />
              }
            />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Suspense>
      </main>
      
      {/* 4. Footer - Persistent across all pages */}
      <Footer 
        email={studentData.contact.email}
        githubUrl={studentData.contact.githubUrl}
        linkedinUrl={studentData.contact.linkedinUrl}
        copyright={studentData.contact.copyright}
      />

      {/* 5. Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default App;
