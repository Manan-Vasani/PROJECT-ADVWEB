import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DoctorsPage from './pages/DoctorsPage';
import BookingPage from './pages/BookingPage';
import './App.css';

/**
 * Main Application Component
 * Task 2: React Router setup with 3 routes:
 *  - /        -> HomePage
 *  - /doctors -> DoctorsPage
 *  - /booking -> BookingPage
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navigation bar containing client-side links */}
        <Navbar />

        {/* Dynamic Route View */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/booking" element={<BookingPage />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="footer">
          <p>© 2026 MedCare Plus Hospital System — ITUE301 Advanced Web Development Frameworks</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
