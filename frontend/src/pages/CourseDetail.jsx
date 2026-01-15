import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourseStore } from "../stores/course.store";
import { useAuthStore } from "../stores/auth.store";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { currentCourse, loading, error, fetchCourse } = useCourseStore();
  const { user } = useAuthStore();
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) return;
    setEnrolling(true);
    try {
      const response = await fetch(`/api/enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) throw new Error('Failed to enroll');
      alert('Enrolled successfully!');
      // Refresh course data or redirect
    } catch (error) {
      alert(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!currentCourse) return <div className="alert alert-info">Course not found</div>;

  const isEnrolled = currentCourse.enrolledStudents?.includes(user?._id);
  const isInstructor = currentCourse.instructorId === user?._id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <h1 className="text-3xl font-bold">{currentCourse.title}</h1>
            <p className="text-lg opacity-70 mt-2">{currentCourse.shortDesc}</p>

            <div className="flex flex-wrap gap-4 mt-4">
              <span className="badge badge-primary">{currentCourse.category.name}</span>
              <span className="badge badge-secondary">{currentCourse.duration || 'Duration not set'}</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span>{currentCourse.stats?.avgRating?.toFixed(1) || 'N/A'}</span>
                <span className="text-sm opacity-60">({currentCourse.stats?.ratingCount || 0} reviews)</span>
              </div>
              <span className="text-sm opacity-60">{currentCourse.stats?.enrolledCount || 0} students enrolled</span>
            </div>

            <div className="card-actions justify-end mt-4">
              {user && !isInstructor && !isEnrolled && (
                <button
                  className={`btn btn-primary ${enrolling ? 'loading' : ''}`}
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
              {isEnrolled && (
                <Link to={`/my-courses/${courseId}`} className="btn btn-success">
                  Continue Learning
                </Link>
              )}
              {isInstructor && (
                <Link to={`/collab/courses/${courseId}/edit`} className="btn btn-outline">
                  Edit Course
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Curriculum Preview */}
        {currentCourse.curriculum && currentCourse.curriculum.length > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
              <div className="space-y-4">
                {currentCourse.curriculum.map((section, index) => (
                  <div key={section._id || index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-sm opacity-70 mt-1">{section.description}</p>
                    <div className="mt-2">
                      <span className="text-sm badge badge-ghost">
                        {section.items?.length || 0} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}