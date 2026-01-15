import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollment/my-enrollments', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading your courses...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-red-900 mb-2">Failed to load dashboard</h3>
      <p className="text-red-700">{error}</p>
    </div>
  );

  const completedCourses = enrollments.filter(e => e.progress === 100);
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100);
  const notStartedCourses = enrollments.filter(e => e.progress === 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Welcome back,
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {user?.email?.split('@')[0] || 'Student'}!
          </span>
        </h1>
        <p className="text-xl text-slate-600">
          Continue your learning journey and track your progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{enrollments.length}</div>
          <div className="text-slate-600 font-medium">Total Courses</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{completedCourses.length}</div>
          <div className="text-slate-600 font-medium">Completed</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{inProgressCourses.length}</div>
          <div className="text-slate-600 font-medium">In Progress</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{completedCourses.filter(e => e.certificateEarned).length}</div>
          <div className="text-slate-600 font-medium">Certificates</div>
        </div>
      </div>

      {/* Courses Sections */}
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200/60">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Start Your Learning Journey</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Browse our catalog and start learning something new today!
          </p>
          <Link
            to="/courses"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Continue Learning */}
          {inProgressCourses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Continue Learning
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inProgressCourses.map(enrollment => (
                  <div key={enrollment._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 group">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          {enrollment.course.shortDesc}
                        </p>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-slate-600 mb-2">
                            <span>Progress</span>
                            <span>{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <Link
                          to={`/my-courses/${enrollment.course._id}`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                        >
                          Continue Learning
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedCourses.map(enrollment => (
                  <div key={enrollment._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 group">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors duration-200">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          {enrollment.course.shortDesc}
                        </p>
                        <div className="flex space-x-3">
                          <Link
                            to={`/my-courses/${enrollment.course._id}`}
                            className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200"
                          >
                            Review Course
                          </Link>
                          {enrollment.certificateEarned && (
                            <Link
                              to={`/certificates/${enrollment._id}`}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                            >
                              View Certificate
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Not Started Courses */}
          {notStartedCourses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Not Started
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notStartedCourses.map(enrollment => (
                  <div key={enrollment._id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 group">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-slate-600 transition-colors duration-200">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          {enrollment.course.shortDesc}
                        </p>
                        <Link
                          to={`/my-courses/${enrollment.course._id}`}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          Start Learning
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m2 0h1.586a1 1 0 01.707.293l.707.707A1 1 0 0020.414 12H21M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}