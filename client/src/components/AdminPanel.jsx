import { useState, useEffect } from 'react';
import { fetchAppointments, deleteAppointment } from '../api';
import './AdminPanel.css';

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetchAppointments();
      setAppointments(response.appointments || []);
      setError('');
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      await deleteAppointment(id);
      setAppointments(prev => prev.filter(apt => apt._id !== id));
    } catch (err) {
      setError('Failed to delete appointment');
      console.error(err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === filter);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>📊 Appointment Management</h2>
        <button onClick={loadAppointments} disabled={loading} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Appointments</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{appointments.length}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {appointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
      </div>

      <div className="appointments-table-container">
        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <p>📭 No appointments found</p>
            <small>Start booking appointments via the chat!</small>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Booked At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(apt => (
                <tr key={apt._id}>
                  <td className="cell-name">{apt.name || 'Guest'}</td>
                  <td>{apt.date}</td>
                  <td>{apt.time}</td>
                  <td>{apt.duration_minutes || 30} min</td>
                  <td>
                    <span className={`status-badge status-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="cell-small">
                    {formatDate(apt.createdAt)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(apt._id)}
                      className="delete-btn"
                      title="Delete appointment"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-footer">
        <small>💾 All appointments are stored in MongoDB</small>
      </div>
    </div>
  );
}
