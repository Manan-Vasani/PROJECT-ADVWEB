import { Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { Contact } from './pages/Contact';
import './App.css';

function App() {
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
        "UI/UX Visual Design",
        "RESTful API Integration",
        "Responsive & Accessible Web Development",
        "Performance Optimization",
        "Git & Collaborative Workflows"
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
      { name: "React / React Native", category: "Frontend", level: "Advanced", percentage: 90 },
      { name: "TypeScript", category: "Frontend", level: "Advanced", percentage: 85 },
      { name: "HTML5 / CSS3 (Sass)", category: "Frontend", level: "Expert", percentage: 95 },
      { name: "Next.js", category: "Frontend", level: "Intermediate", percentage: 75 },
      
      // Backend / Databases
      { name: "Node.js (Express)", category: "Backend & Systems", level: "Intermediate", percentage: 80 },
      { name: "PostgreSQL / MongoDB", category: "Backend & Systems", level: "Intermediate", percentage: 75 },
      { name: "REST APIs", category: "Backend & Systems", level: "Advanced", percentage: 88 },
      
      // Developer Tools & Design
      { name: "Git & GitHub", category: "Tools & Design", level: "Advanced", percentage: 90 },
      { name: "Figma", category: "Tools & Design", level: "Intermediate", percentage: 80 },
      { name: "Docker", category: "Tools & Design", level: "Beginner", percentage: 50 }
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
      {/* 1. NavBar - Persistent Navigation with React Router Links */}
      <NavBar name={studentData.personal.name} />
      
      {/* 2. Routes Wrapper - Swaps center content views without page reloads */}
      <main>
        <Routes>
          <Route path="/" element={<Home studentData={studentData} />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      
      {/* 3. Footer - Persistent across all pages */}
      <Footer 
        email={studentData.contact.email}
        githubUrl={studentData.contact.githubUrl}
        linkedinUrl={studentData.contact.linkedinUrl}
        copyright={studentData.contact.copyright}
      />
    </div>
  );
}

export default App;
