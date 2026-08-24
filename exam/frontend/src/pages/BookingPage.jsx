import React, { useState, useEffect } from 'react';
import { CalendarPlus, CheckCircle2, User, Stethoscope, Clock, Calendar, FileText, Send } from 'lucide-react';
import AppointmentCard from '../components/AppointmentCard';

/**
 * Task 2 Component: BookingPage
 * Features:
 * - Controlled form for Patient Name, Doctor Name, Date, Time Slot, Reason
 * - Meaningfully manages multiple states with useState (formData, selectedDoctor, bookedAppointments, submissionStatus)
 * - Live State Preview: Real-time display of entered patient name & doctor as keystrokes change
 * - Renders created appointments via <AppointmentCard /> (Task 1)
 */
const BookingPage = () => {
  // State 1: Form data state
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    reason: '',
    status: 'pending'
  });

  // State 2: Selected Doctor metadata state (used meaningfully for doctor details)
  const [selectedDoctor, setSelectedDoctor] = useState({
    name: '',
    specialisation: '',
    available: true
  });

  // State 3: Local list of booked appointments to render with <AppointmentCard />
  const [bookedAppointments, setBookedAppointments] = useState([
    {
      id: 'demo-1',
      patientName: 'Eleanor Vance',
      doctorName: 'Dr. Sarah Jenkins',
      date: '2026-08-28',
      timeSlot: '09:30 AM',
      status: 'confirmed'
    }
  ]);

  // State 4: Form submission feedback state
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  // Load doctors list for dropdown selection
  useEffect(() => {
    fetch('http://localhost:5000/api/v1/doctors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableDoctors(data);
          // Set initial default doctor
          setFormData(prev => ({ ...prev, doctorName: data[0].name }));
          setSelectedDoctor({
            name: data[0].name,
            specialisation: data[0].specialisation,
            available: data[0].available
          });
        }
      })
      .catch(() => {
        // Fallback default doctors
        const defaults = [
          { name: 'Dr. Sarah Jenkins', specialisation: 'Cardiology', available: true },
          { name: 'Dr. Alex Rivera', specialisation: 'Neurology', available: true },
          { name: 'Dr. Marcus Vance', specialisation: 'Orthopedics', available: true },
          { name: 'Dr. Priya Patel', specialisation: 'Dermatology', available: true }
        ];
        setAvailableDoctors(defaults);
        setFormData(prev => ({ ...prev, doctorName: defaults[0].name }));
        setSelectedDoctor(defaults[0]);
      });
  }, []);

  // Handle text & input state changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If doctor dropdown changed, update the selectedDoctor state meaningfully
    if (name === 'doctorName') {
      const found = availableDoctors.find(d => d.name === value);
      if (found) {
        setSelectedDoctor(found);
      }
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientName.trim()) {
      setSubmissionFeedback({ type: 'error', message: 'Please enter patient name.' });
      return;
    }

    try {
      // POST to backend API (Task 3)
      const res = await fetch('http://localhost:5000/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.patientName,
          doctorName: formData.doctorName,
          date: formData.date,
          timeSlot: formData.timeSlot,
          status: formData.status,
          reason: formData.reason
        })
      });

      const data = await res.json();

      const newEntry = {
        id: String(Date.now()),
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        date: formData.date,
        timeSlot: formData.timeSlot,
        status: formData.status
      };

      setBookedAppointments(prev => [newEntry, ...prev]);
      setSubmissionFeedback({
        type: 'success',
        message: `Appointment successfully registered for ${formData.patientName} with ${formData.doctorName}!`
      });

      // Reset patient name and reason
      setFormData(prev => ({
        ...prev,
        patientName: '',
        reason: '',
        status: 'pending'
      }));
    } catch (err) {
      console.warn('API post fallback to local state:', err.message);
      const fallbackEntry = {
        id: String(Date.now()),
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        date: formData.date,
        timeSlot: formData.timeSlot,
        status: formData.status
      };
      setBookedAppointments(prev => [fallbackEntry, ...prev]);
      setSubmissionFeedback({
        type: 'success',
        message: `Appointment logged locally for ${formData.patientName}!`
      });
      setFormData(prev => ({ ...prev, patientName: '', reason: '' }));
    }
  };

  return (
    <div className="booking-page">
      <div className="section-title-wrap">
        <h1 className="section-title">Schedule an Appointment</h1>
        <p className="section-subtitle">
          React State-managed form with real-time reactive preview and <code>&lt;AppointmentCard /&gt;</code> rendering
        </p>
      </div>

      {submissionFeedback && (
        <div 
          className={submissionFeedback.type === 'success' ? 'status-badge status-confirmed' : 'status-badge status-cancelled'}
          style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}
        >
          <CheckCircle2 size={18} />
          <span>{submissionFeedback.message}</span>
        </div>
      )}

      <div className="booking-grid">
        {/* Left Column: Form Section */}
        <div className="card-box">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarPlus size={20} color="var(--primary)" />
            Patient Booking Form
          </h2>

          <form onSubmit={handleSubmit}>
            {/* 1. Patient Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="patientName">
                Patient Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="patientName"
                name="patientName"
                type="text"
                className="form-input"
                placeholder="e.g. Johnathan Smith"
                value={formData.patientName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* 2. Doctor Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="doctorName">
                Assign Specialist / Doctor <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="doctorName"
                name="doctorName"
                className="form-select"
                value={formData.doctorName}
                onChange={handleInputChange}
              >
                {availableDoctors.map((doc, idx) => (
                  <option key={doc._id || doc.id || idx} value={doc.name}>
                    {doc.name} ({doc.specialisation})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date & Time Slot (Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="date">
                  Appointment Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="timeSlot">
                  Time Slot <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="timeSlot"
                  name="timeSlot"
                  className="form-select"
                  value={formData.timeSlot}
                  onChange={handleInputChange}
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="04:45 PM">04:45 PM</option>
                </select>
              </div>
            </div>

            {/* 4. Initial Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                Initial Appointment Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="pending">Pending (Awaiting Confirmation)</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* 5. Consultation Reason */}
            <div className="form-group">
              <label className="form-label" htmlFor="reason">
                Reason for Consultation (Max 300 chars)
              </label>
              <textarea
                id="reason"
                name="reason"
                className="form-textarea"
                rows="3"
                placeholder="Briefly describe symptoms or purpose of visit..."
                maxLength="300"
                value={formData.reason}
                onChange={handleInputChange}
              ></textarea>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', float: 'right' }}>
                {formData.reason.length}/300 chars
              </span>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              <Send size={18} />
              Confirm & Book Appointment
            </button>
          </form>
        </div>

        {/* Right Column: Real-time State Preview (Task 2 Requirement) */}
        <div>
          <div className="live-preview-box">
            <span className="preview-badge">Task 2: Real-Time State Preview</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Live Patient State: <span style={{ color: 'var(--primary)' }}>{formData.patientName || '(Typing Patient Name...)'}</span>
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Selected Doctor: <strong>{selectedDoctor.name || formData.doctorName}</strong> ({selectedDoctor.specialisation || 'Specialist'})
            </p>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Live AppointmentCard Preview:
              </div>
              <AppointmentCard
                patientName={formData.patientName || 'Patient Name Preview'}
                doctorName={formData.doctorName || 'Doctor Name'}
                date={formData.date}
                timeSlot={formData.timeSlot}
                status={formData.status}
              />
            </div>
          </div>

          {/* Booked Appointments Feed */}
          <div className="card-box">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Recent Bookings ({bookedAppointments.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {bookedAppointments.map((item, idx) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
