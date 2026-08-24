import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Users, CalendarPlus, Home } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand-logo">
          <Activity size={26} />
          <span>MedCare Plus</span>
          <span className="tag">Hospital System</span>
        </Link>
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                <Home size={18} />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/doctors" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Doctors</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/booking" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <CalendarPlus size={18} />
                <span>Book Appointment</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
