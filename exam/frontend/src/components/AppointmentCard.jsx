import React from 'react';
import { User, Stethoscope, Calendar, Clock, CheckCircle2, Clock3, XCircle } from 'lucide-react';

/**
 * Task 1 Component: AppointmentCard
 * Accepts 5 required props: patientName, doctorName, date, timeSlot, status
 * Dynamically changes appearance based on status: 'confirmed', 'pending', 'cancelled'
 */
const AppointmentCard = ({ patientName, doctorName, date, timeSlot, status }) => {
  // Normalize status value
  const normalizedStatus = (status || 'pending').toLowerCase();

  // Status badge config
  const getStatusConfig = (st) => {
    switch (st) {
      case 'confirmed':
        return {
          className: 'status-badge status-confirmed confirmed',
          icon: <CheckCircle2 size={14} />,
          label: 'Confirmed'
        };
      case 'cancelled':
        return {
          className: 'status-badge status-cancelled cancelled',
          icon: <XCircle size={14} />,
          label: 'Cancelled'
        };
      case 'pending':
      default:
        return {
          className: 'status-badge status-pending pending',
          icon: <Clock3 size={14} />,
          label: 'Pending'
        };
    }
  };

  const statusConfig = getStatusConfig(normalizedStatus);

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <div>
          <div className="appointment-patient">
            <User size={18} color="#0284c7" />
            <span>{patientName || 'Anonymous Patient'}</span>
          </div>
          <div className="appointment-doctor">
            <Stethoscope size={16} />
            <span>{doctorName || 'Assigned Specialist'}</span>
          </div>
        </div>
        <span className={statusConfig.className}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="appointment-meta">
        <div className="meta-item">
          <Calendar size={15} />
          <span>{date || 'Date not set'}</span>
        </div>
        <div className="meta-item">
          <Clock size={15} />
          <span>{timeSlot || 'Slot not set'}</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
