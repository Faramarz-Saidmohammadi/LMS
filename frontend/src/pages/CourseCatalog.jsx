import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourseStore } from "../stores/course.store";

export default function CourseCatalog() {
  const { courses, loading, error, fetchPublishedCourses } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchPublishedCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(courses.map(course => course.category?.name).filter(Boolean))];

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading courses...</p>
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
      <h3 className="text-xl font-semibold text-red-900 mb-2">Failed to load courses</h3>
      <p className="text-red-700">{error}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Discover Your Next
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Learning Adventure
          </span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Explore our curated collection of expert-led courses designed to help you master new skills and advance your career.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[200px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-slate-600">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
          <p className="text-slate-600 mb-6">Try adjusting your search or filter criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="card card-hover group overflow-hidden"
            >
              {/* Course Image */}
              <div className="aspect-video bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                    {course.category?.name || 'General'}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                  {course.title}
                </h3>
                <p className="text-slate-600 mb-4 line-clamp-3">
                  {course.shortDesc}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {course.instructor?.name?.charAt(0)?.toUpperCase() || 'I'}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      {course.instructor?.name || 'Instructor'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </div>
                    {course.price > 0 && course.originalPrice && (
                      <div className="text-sm text-slate-500 line-through">
                        ${course.originalPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating and Students */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-sm text-slate-600 font-medium">
                      {course.rating || 4.5}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {course.enrolledCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}