import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavBarProps {
  name: string;
}

export const NavBar: React.FC<NavBarProps> = ({ name }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-dot"></span>
        <span className="brand-text">{name}</span>
      </div>
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Home
        </NavLink>
        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Projects
        </NavLink>
        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Task Manager (API)
        </NavLink>
        <NavLink 
          to="/contact" 
          className={({ isActive }) => `nav-link highlight ${isActive ? 'active' : ''}`}
        >
          Get in Touch
        </NavLink>
      </div>
    </nav>
  );
};
