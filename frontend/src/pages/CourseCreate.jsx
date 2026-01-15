import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    startDate: '',
    duration: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create course');

      const data = await response.json();
      navigate(`/collab/courses/${data.course._id}/edit`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Course</h1>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Course Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="input input-bordered"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength="120"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Short Description</span>
                </label>
                <textarea
                  name="shortDesc"
                  className="textarea textarea-bordered"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  required
                  maxLength="400"
                  rows="3"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Date</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  className="input input-bordered"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Duration</span>
                </label>
                <input
                  type="text"
                  name="duration"
                  className="input input-bordered"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 4 weeks, 10 hours"
                  maxLength="60"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <select
                  name="category"
                  className="select select-bordered"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="web-development">Web Development</option>
                  {/* Add more categories */}
                </select>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <div className="card-actions justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/collab/dashboard')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}