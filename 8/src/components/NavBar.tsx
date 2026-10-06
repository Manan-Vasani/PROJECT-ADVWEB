import React from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../services/api';

interface NavBarProps {
  name: string;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  name,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
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
          Task Manager (JWT Auth)
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => `nav-link highlight ${isActive ? 'active' : ''}`}
        >
          Get in Touch
        </NavLink>
      </div>

      {/* User Auth Status Pill */}
      <div className="nav-auth-section">
        {currentUser ? (
          <div className="user-profile-pill">
            <span className="user-avatar-dot">●</span>
            <span className="user-name-text">{currentUser.name}</span>
            <button
              type="button"
              className="btn-logout-small"
              onClick={onLogout}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              className="btn-signin-nav"
              onClick={onOpenAuth}
            >
              <span>🔐</span>
              <span>Sign In</span>
            </button>
          )
        )}
      </div>
    </nav>
  );
};
