import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Users, Stethoscope, ShieldCheck, HeartPulse, Building2 } from 'lucide-react';
import AppointmentCard from '../components/AppointmentCard';

const HomePage = () => {
  const [appointments, setAppointments] = useState([]);

  // Fetch or load demo appointments to showcase Task 1 & 2
  useEffect(() => {
    fetch('/api/v1/appointments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch(() => {
        // Fallback default sample appointments
        setAppointments([
          {
            patientName: 'John Doe',
            doctorName: 'Dr. Sarah Jenkins (Cardiology)',
            date: '2026-08-25',
            timeSlot: '10:00 AM',
            status: 'confirmed'
          },
          {
            patientName: 'Alice Smith',
            doctorName: 'Dr. Alex Rivera (Neurology)',
            date: '2026-08-26',
            timeSlot: '02:30 PM',
            status: 'pending'
          },
          {
            patientName: 'Robert Johnson',
            doctorName: 'Dr. Marcus Vance (Orthopedics)',
            date: '2026-08-27',
            timeSlot: '11:15 AM',
            status: 'cancelled'
          }
        ]);
      });
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">MedCare Plus Hospital Management</h1>
          <p className="hero-subtitle">
            Seamlessly manage doctor schedules, book real-time patient appointments, and access clinical specialists with enterprise reliability.
          </p>
          <div className="hero-actions">
            <Link to="/booking" className="btn-hero-primary">
              <CalendarPlus size={20} />
              Book an Appointment
            </Link>
            <Link to="/doctors" className="btn-hero-secondary">
              <Users size={20} />
              View Specialists
            </Link>
          </div>
        </div>
      </section>

      {/* Hospital Key Metrics */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Stethoscope size={24} />
          </div>
          <div className="stat-info">
            <h3>25+</h3>
            <p>Certified Specialists</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <HeartPulse size={24} />
          </div>
          <div className="stat-info">
            <h3>99.4%</h3>
            <p>Patient Satisfaction</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Clinical Departments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>24/7</h3>
            <p>Emergency & Critical Care</p>
          </div>
        </div>
      </section>

      {/* Appointment Cards Demonstration (Task 1) */}
      <section>
        <div className="section-title-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Current Hospital Appointments</h2>
            <p className="section-subtitle">Rendered dynamically via the reusable <code>&lt;AppointmentCard /&gt;</code> component</p>
          </div>
          <Link to="/booking" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            + Book New &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {appointments.slice(0, 6).map((item, idx) => (
            <AppointmentCard
              key={item.id || idx}
              patientName={item.patientName}
              doctorName={item.doctorName}
              date={item.date}
              timeSlot={item.timeSlot}
              status={item.status}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
