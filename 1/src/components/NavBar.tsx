import React, { useEffect, useState } from 'react';

interface NavBarProps {
  name: string;
}

export const NavBar: React.FC<NavBarProps> = ({ name }) => {
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    // The sections we want to monitor scroll for
    const sections = ['about', 'skills', 'contact'];
    
    // Setting up the observer to trigger when a section occupies the middle of the viewport
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Cleanup observer on unmount
    return () => {
      sections.forEach((id) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-dot"></span>
        <span className="brand-text">{name}</span>
      </div>
      <div className="nav-links">
        <a 
          href="#about" 
          className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
        >
          About
        </a>
        <a 
          href="#skills" 
          className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
        >
          Skills
        </a>
        <a 
          href="#contact" 
          className={`nav-link highlight ${activeSection === 'contact' ? 'active' : ''}`}
        >
          Get in Touch
        </a>
      </div>
    </nav>
  );
};
