import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizEditor from '../components/QuizEditor';

export default function CourseEdit() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (updates) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update course');
      const updated = await response.json();
      setCourse(updated);
    } catch (error) {
      alert(error.message);
    }
  };

  const submitForReview = async () => {
    if (!course.title || !course.shortDesc || !course.category) {
      alert('Please complete course details first');
      return;
    }
    await updateCourse({ status: 'under_review' });
    alert('Course submitted for review!');
    navigate('/collab/dashboard');
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!course) return <div className="alert alert-info">Course not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Course: {course.title}</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-outline"
            onClick={() => navigate('/collab/dashboard')}
          >
            Back to Dashboard
          </button>
          {course.status === 'draft' && (
            <button
              className="btn btn-primary"
              onClick={submitForReview}
            >
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`badge ${
          course.status === 'published' ? 'badge-success' :
          course.status === 'under_review' ? 'badge-warning' :
          course.status === 'rejected' ? 'badge-error' : 'badge-info'
        }`}>
          {course.status.replace('_', ' ')}
        </span>
        {course.feedback?.length > 0 && (
          <div className="mt-2">
            <h3 className="font-semibold">Admin Feedback:</h3>
            {course.feedback.map((fb, idx) => (
              <div key={idx} className="alert alert-info mt-2">
                <span>{fb.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <a
          className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Course Details
        </a>
        <a
          className={`tab ${activeTab === 'curriculum' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          Curriculum
        </a>
        <a
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </a>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <CourseDetailsTab course={course} onUpdate={updateCourse} />
      )}

      {activeTab === 'curriculum' && (
        <CurriculumTab course={course} onUpdate={fetchCourse} />
      )}

      {activeTab === 'settings' && (
        <CourseSettingsTab course={course} onUpdate={updateCourse} />
      )}
    </div>
  );
}

// Course Details Tab Component
function CourseDetailsTab({ course, onUpdate }) {
  const [formData, setFormData] = useState({
    title: course.title || '',
    shortDesc: course.shortDesc || '',
    startDate: course.startDate ? course.startDate.split('T')[0] : '',
    duration: course.duration || '',
    category: course.category?._id || course.category || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
    alert('Course details updated!');
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title">Course Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Title</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="card-actions justify-end">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Curriculum Tab Component
function CurriculumTab({ course, onUpdate }) {
  const [sections, setSections] = useState(course.curriculum || []);

  const addSection = () => {
    const newSection = {
      title: '',
      description: '',
      items: [],
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index, updates) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    setSections(updated);
  };

  const deleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const saveCurriculum = async () => {
    try {
      const response = await fetch(`/api/courses/${course._id}/curriculum`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ curriculum: sections }),
      });
      if (!response.ok) throw new Error('Failed to save curriculum');
      alert('Curriculum saved!');
      onUpdate();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Curriculum</h2>
        <button className="btn btn-primary" onClick={addSection}>
          Add Section
        </button>
      </div>

      {sections.map((section, index) => (
        <div key={index} className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Section Title"
                  className="input input-bordered w-full mb-2"
                  value={section.title}
                  onChange={(e) => updateSection(index, { title: e.target.value })}
                />
                <textarea
                  placeholder="Section Description"
                  className="textarea textarea-bordered w-full"
                  value={section.description}
                  onChange={(e) => updateSection(index, { description: e.target.value })}
                  rows="2"
                />
              </div>
              <button
                className="btn btn-error btn-sm ml-4"
                onClick={() => deleteSection(index)}
              >
                Delete
              </button>
            </div>

            {/* Curriculum Items */}
            <CurriculumItems
              items={section.items || []}
              onUpdateItems={(items) => updateSection(index, { items })}
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button className="btn btn-success" onClick={saveCurriculum}>
          Save Curriculum
        </button>
      </div>
    </div>
  );
}

// Curriculum Items Component
function CurriculumItems({ items, onUpdateItems }) {
  const [editingQuiz, setEditingQuiz] = useState(null);

  const addItem = (type) => {
    const newItem = {
      type,
      title: '',
      content: '',
      duration: 0,
      isFree: false,
    };
    if (type === 'quiz') {
      newItem.quiz = { title: '', description: '', questions: [] };
    }
    onUpdateItems([...items, newItem]);
  };

  const updateItem = (itemIndex, updates) => {
    const updated = [...items];
    updated[itemIndex] = { ...updated[itemIndex], ...updates };
    onUpdateItems(updated);
  };

  const deleteItem = (itemIndex) => {
    onUpdateItems(items.filter((_, i) => i !== itemIndex));
  };

  const saveQuiz = (itemIndex, quizData) => {
    updateItem(itemIndex, { quiz: quizData });
    setEditingQuiz(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={() => addItem('article')}>
          Add Article
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => addItem('video')}>
          Add Video
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => addItem('quiz')}>
          Add Quiz
        </button>
      </div>

      {items.map((item, itemIndex) => (
        <div key={itemIndex} className="border rounded-lg p-4 bg-base-200">
          <div className="flex justify-between items-start mb-2">
            <span className="badge badge-primary">{item.type}</span>
            <button
              className="btn btn-error btn-xs"
              onClick={() => deleteItem(itemIndex)}
            >
              ×
            </button>
          </div>

          <input
            type="text"
            placeholder="Item Title"
            className="input input-bordered input-sm w-full mb-2"
            value={item.title}
            onChange={(e) => updateItem(itemIndex, { title: e.target.value })}
          />

          {item.type === 'video' && (
            <input
              type="url"
              placeholder="YouTube URL"
              className="input input-bordered input-sm w-full mb-2"
              value={item.content}
              onChange={(e) => updateItem(itemIndex, { content: e.target.value })}
            />
          )}

          {item.type === 'article' && (
            <textarea
              placeholder="Article content (rich text)"
              className="textarea textarea-bordered textarea-sm w-full mb-2"
              value={item.content}
              onChange={(e) => updateItem(itemIndex, { content: e.target.value })}
              rows="3"
            />
          )}

          {item.type === 'quiz' && (
            <div className="mb-2">
              {item.quiz ? (
                <div>
                  <p className="text-sm mb-2">
                    Quiz: {item.quiz.title || 'Untitled Quiz'} - {item.quiz.questions?.length || 0} questions
                  </p>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setEditingQuiz(itemIndex)}
                  >
                    Edit Quiz
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => setEditingQuiz(itemIndex)}
                >
                  Create Quiz
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Duration (min)"
              className="input input-bordered input-xs w-24"
              value={item.duration}
              onChange={(e) => updateItem(itemIndex, { duration: parseInt(e.target.value) || 0 })}
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={item.isFree}
                onChange={(e) => updateItem(itemIndex, { isFree: e.target.checked })}
              />
              Free Preview
            </label>
          </div>
        </div>
      ))}

      {/* Quiz Editor Modal */}
      {editingQuiz !== null && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Edit Quiz</h3>
            <QuizEditor
              quiz={items[editingQuiz].quiz}
              onSave={(quizData) => saveQuiz(editingQuiz, quizData)}
              onCancel={() => setEditingQuiz(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Course Settings Tab Component
function CourseSettingsTab({ course, onUpdate }) {
  const [settings, setSettings] = useState({
    isPublic: course.isPublic || false,
    requiresEnrollment: course.requiresEnrollment !== false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(settings);
    alert('Settings updated!');
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title">Course Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Public Course</span>
              <input
                type="checkbox"
                name="isPublic"
                className="checkbox"
                checked={settings.isPublic}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Requires Enrollment</span>
              <input
                type="checkbox"
                name="requiresEnrollment"
                className="checkbox"
                checked={settings.requiresEnrollment}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="card-actions justify-end">
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}