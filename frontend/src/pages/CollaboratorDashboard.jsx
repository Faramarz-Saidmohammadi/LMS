import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CollaboratorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const coursesRes = await fetch('/api/collab/courses', { credentials: 'include' });
      if (!coursesRes.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesRes.json();
      setCourses(coursesData.courses || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const statusCounts = courses.reduce((acc, course) => {
    acc[course.status] = (acc[course.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Collaborator Dashboard</h1>
        <Link to="/collab/courses/create" className="btn btn-primary">
          Create New Course
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Total Courses</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Published</div>
          <div className="stat-value text-success">{statusCounts.published || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Under Review</div>
          <div className="stat-value text-warning">{statusCounts.under_review || 0}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Draft</div>
          <div className="stat-value text-info">{statusCounts.draft || 0}</div>
        </div>
      </div>

      {/* Courses List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-4">My Courses</h2>

          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg opacity-60 mb-4">You haven't created any courses yet.</p>
              <Link to="/collab/courses/create" className="btn btn-primary">
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course._id}>
                      <td>
                        <div>
                          <div className="font-bold">{course.title}</div>
                          <div className="text-sm opacity-60">{course.shortDesc}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          course.status === 'published' ? 'badge-success' :
                          course.status === 'under_review' ? 'badge-warning' :
                          course.status === 'rejected' ? 'badge-error' : 'badge-info'
                        }`}>
                          {course.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/collab/courses/${course._id}/edit`}
                            className="btn btn-sm btn-outline"
                          >
                            Edit
                          </Link>
                          {course.status === 'draft' && (
                            <button className="btn btn-sm btn-primary">
                              Submit for Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}