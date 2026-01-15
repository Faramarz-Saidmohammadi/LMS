import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, coursesRes, invitesRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/courses?status=under_review', { credentials: 'include' }),
        fetch('/api/admin/invitations', { credentials: 'include' })
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : {};
      const coursesData = coursesRes.ok ? await coursesRes.json() : [];
      const invitesData = invitesRes.ok ? await invitesRes.json() : [];

      setStats(statsData);
      setCourses(coursesData.courses || []);
      setInvitations(invitesData.invitations || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (courseId, action, feedback = '') => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) throw new Error('Action failed');

      alert(`Course ${action}d successfully!`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      alert(error.message);
    }
  };

  const sendInvitation = async (email) => {
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role: 'collaborator' }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      alert('Invitation sent successfully!');
      fetchDashboardData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{stats.totalUsers || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Published Courses</div>
          <div className="stat-value text-success">{stats.publishedCourses || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Pending Review</div>
          <div className="stat-value text-warning">{stats.pendingCourses || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Total Enrollments</div>
          <div className="stat-value text-info">{stats.totalEnrollments || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <a
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </a>
        <a
          className={`tab ${activeTab === 'courses' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Course Reviews
        </a>
        <a
          className={`tab ${activeTab === 'invitations' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Invitations
        </a>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} />
      )}

      {activeTab === 'courses' && (
        <CoursesReviewTab courses={courses} onAction={handleCourseAction} />
      )}

      {activeTab === 'invitations' && (
        <InvitationsTab invitations={invitations} onSendInvitation={sendInvitation} />
      )}
    </div>
  );
}

// Overview Tab
function OverviewTab({ stats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Recent Activity</h2>
          <div className="space-y-2">
            <p>📚 {stats.recentCourses || 0} courses created this week</p>
            <p>👥 {stats.recentUsers || 0} new users registered</p>
            <p>✅ {stats.recentApprovals || 0} courses approved</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="space-y-2">
            <button className="btn btn-primary btn-block">Send Invitation</button>
            <button className="btn btn-outline btn-block">View All Courses</button>
            <button className="btn btn-outline btn-block">Manage Categories</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Course Reviews Tab
function CoursesReviewTab({ courses, onAction }) {
  const [feedback, setFeedback] = useState('');

  const handleAction = (courseId, action) => {
    onAction(courseId, action, feedback);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Courses Pending Review</h2>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg opacity-60">No courses pending review</p>
        </div>
      ) : (
        courses.map(course => (
          <div key={course._id} className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{course.title}</h3>
                  <p className="opacity-70">{course.shortDesc}</p>
                  <p className="text-sm mt-2">
                    By: {course.instructorId?.name} | Category: {course.category?.name}
                  </p>
                </div>
                <span className="badge badge-warning">Under Review</span>
              </div>

              <div className="mb-4">
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Feedback for rejection (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="card-actions justify-end">
                <button
                  className="btn btn-error"
                  onClick={() => handleAction(course._id, 'reject')}
                >
                  Reject
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleAction(course._id, 'approve')}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Invitations Tab
function InvitationsTab({ invitations, onSendInvitation }) {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    if (!email) return;
    onSendInvitation(email);
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Send Invitation</h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Collaborator email"
              className="input input-bordered flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!email}
            >
              Send Invite
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Recent Invitations</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.slice(0, 10).map(invite => (
                  <tr key={invite._id}>
                    <td>{invite.email}</td>
                    <td>
                      <span className={`badge ${
                        invite.status === 'accepted' ? 'badge-success' :
                        invite.status === 'pending' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {invite.status}
                      </span>
                    </td>
                    <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                    <td>
                      {invite.status === 'pending' && (
                        <button className="btn btn-xs btn-outline">
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
