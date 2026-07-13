import React from 'react';

interface Project {
  title: string;
  description: string;
  tags: string[];
  link: string;
}

export const Projects: React.FC = () => {
  const projectsList: Project[] = [
    {
      title: "Interactive E-Commerce Platform",
      description: "An elegant, Apple-inspired store layout built using React, TypeScript, and Stripe payment integration. Focuses on minimal animations and micro-interactions.",
      tags: ["React", "TypeScript", "CSS Modules", "Stripe"],
      link: "https://github.com/JHON-WICK-007/e-store"
    },
    {
      title: "AI-Powered Task Orchestrator",
      description: "A developer productivity dashboard incorporating natural language task scheduling, drag-and-drop kanban columns, and automatic time logging.",
      tags: ["React", "Node.js", "Express", "MongoDB", "OpenAI"],
      link: "https://github.com/JHON-WICK-007/ai-tasks"
    },
    {
      title: "Sleek Crypto Portfolio Tracker",
      description: "A real-time price monitoring web application with live WebSocket feeds, HSL dynamic theme charts, and secure local storage transaction logs.",
      tags: ["React Native", "WebSockets", "ChartJS", "TailwindCSS"],
      link: "https://github.com/JHON-WICK-007/crypto-track"
    },
    {
      title: "Responsive Personal Portfolio Engine",
      description: "This portfolio template using modular React components, custom CSS custom properties, and static compilation paths for high performance.",
      tags: ["Vite", "React", "TypeScript", "CSS Variables"],
      link: "https://github.com/JHON-WICK-007/portfolio"
    }
  ];

  return (
    <section className="projects-section">
      <div className="section-header">
        <h2 className="section-title"><span className="number">03.</span> Featured Projects</h2>
        <div className="section-line"></div>
      </div>
      
      <div className="projects-grid">
        {projectsList.map((project, idx) => (
          <div key={idx} className="project-card">
            <div className="project-tags">
              {project.tags.map((tag, tagIdx) => (
                <span key={tagIdx} className="project-tag">{tag}</span>
              ))}
            </div>
            <h3 className="project-title">{project.title}</h3>
            <p className="project-description">{project.description}</p>
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
              View Source Code ➔
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};
