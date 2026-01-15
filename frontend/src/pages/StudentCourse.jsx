import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnrollmentData();
  }, [courseId]);

  const fetchEnrollmentData = async () => {
    try {
      const [enrollmentRes, courseRes] = await Promise.all([
        fetch(`/api/enrollment/my-enrollment/${courseId}`, { credentials: 'include' }),
        fetch(`/api/courses/${courseId}`, { credentials: 'include' })
      ]);

      if (!enrollmentRes.ok || !courseRes.ok) {
        throw new Error('Failed to fetch course data');
      }

      const enrollmentData = await enrollmentRes.json();
      const courseData = await courseRes.json();

      setEnrollment(enrollmentData.enrollment);
      setCourse(courseData);

      // Set first item as current if available
      if (courseData.curriculum?.length > 0 && courseData.curriculum[0].items?.length > 0) {
        setCurrentItem(courseData.curriculum[0].items[0]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markItemComplete = async (itemId) => {
    try {
      const response = await fetch(`/api/enrollment/${enrollment._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId, completed: true }),
      });

      if (!response.ok) throw new Error('Failed to update progress');

      // Refresh enrollment data
      fetchEnrollmentData();
    } catch (error) {
      alert(error.message);
    }
  };

  const calculateProgress = () => {
    if (!course?.curriculum) return 0;
    const totalItems = course.curriculum.reduce((sum, section) => sum + (section.items?.length || 0), 0);
    const completedItems = enrollment?.progress?.completedItems?.length || 0;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!enrollment || !course) return <div className="alert alert-info">Enrollment not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-lg opacity-70 mt-2">Continue your learning journey</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Progress Bar */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Course Progress</span>
            <span className="text-sm">{calculateProgress()}% Complete</span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={calculateProgress()}
            max="100"
          ></progress>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curriculum Sidebar */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-lg sticky top-4">
            <div className="card-body">
              <h2 className="card-title">Course Curriculum</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {course.curriculum?.map((section, sectionIndex) => (
                  <div key={section._id || sectionIndex}>
                    <h3 className="font-semibold mb-2">{section.title}</h3>
                    <div className="space-y-1 ml-4">
                      {section.items?.map((item, itemIndex) => {
                        const isCompleted = enrollment.progress?.completedItems?.includes(item._id);
                        const isCurrent = currentItem?._id === item._id;

                        return (
                          <div
                            key={item._id || itemIndex}
                            className={`p-2 rounded cursor-pointer hover:bg-base-200 ${
                              isCurrent ? 'bg-primary text-primary-content' : ''
                            }`}
                            onClick={() => setCurrentItem(item)}
                          >
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <span className="text-success">✓</span>
                              ) : (
                                <span className="text-gray-400">○</span>
                              )}
                              <span className="text-sm">{item.title}</span>
                              <span className="text-xs opacity-60 ml-auto">
                                {item.type}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          {currentItem ? (
            <CourseItemContent
              item={currentItem}
              onComplete={() => markItemComplete(currentItem._id)}
              isCompleted={enrollment.progress?.completedItems?.includes(currentItem._id)}
            />
          ) : (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <h2 className="text-xl font-semibold">Welcome to the course!</h2>
                <p className="mt-2">Select a lesson from the curriculum to begin learning.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Course Item Content Component
function CourseItemContent({ item, onComplete, isCompleted }) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const handleQuizSubmit = async () => {
    // Calculate score
    let correct = 0;
    let total = item.quiz?.questions?.length || 0;

    item.quiz?.questions?.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setQuizScore(score);
    setQuizSubmitted(true);

    // Mark as completed
    onComplete();
  };

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {item.content ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(item.content)}`}
                className="w-full h-full"
                allowFullScreen
                title={item.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                Video not available
              </div>
            )}
          </div>
        );

      case 'article':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        );

      case 'quiz':
        if (quizSubmitted) {
          return (
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4">Quiz Completed!</h3>
              <div className="text-6xl mb-4">
                {quizScore >= 80 ? '🎉' : quizScore >= 60 ? '👍' : '📚'}
              </div>
              <p className="text-xl mb-2">Your Score: {quizScore}%</p>
              <p className="opacity-70">
                {quizScore >= 80 ? 'Excellent work!' :
                 quizScore >= 60 ? 'Good job! Keep learning.' :
                 'Keep practicing to improve your score.'}
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {item.quiz?.questions?.map((question, qIndex) => (
              <div key={qIndex} className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title text-lg">{question.question}</h4>
                  <div className="space-y-2">
                    {question.options?.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={(e) => setQuizAnswers(prev => ({
                            ...prev,
                            [qIndex]: parseInt(e.target.value)
                          }))}
                          className="radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <button
                className="btn btn-primary"
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length !== item.quiz?.questions?.length}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p>Content type not supported yet.</p>
          </div>
        );
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">{item.title}</h2>
          {item.type !== 'quiz' && (
            <button
              className={`btn ${isCompleted ? 'btn-success' : 'btn-primary'}`}
              onClick={onComplete}
              disabled={isCompleted}
            >
              {isCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>
          )}
        </div>

        <div className="mb-4">
          <span className={`badge ${item.type === 'video' ? 'badge-info' :
                                   item.type === 'article' ? 'badge-neutral' :
                                   'badge-warning'}`}>
            {item.type}
          </span>
          {item.duration && (
            <span className="badge badge-ghost ml-2">
              {item.duration} min
            </span>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

// Helper function to extract YouTube ID
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}