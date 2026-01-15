import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const { isAuth, user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white animate-fade-in-up">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Master New Skills with
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Expert-Led Courses
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
            Join thousands of learners worldwide and advance your career with our comprehensive online courses taught by industry experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="btn-primary"
            >
              Explore Courses
            </Link>
            {!isAuth && (
              <Link
                to="/register"
                className="btn-secondary text-white border-white hover:bg-white hover:text-blue-600"
              >
                Start Learning Today
              </Link>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card card-hover p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">500+</h3>
          <p className="text-slate-600 font-medium">Expert Courses</p>
        </div>

        <div className="card card-hover p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">50K+</h3>
          <p className="text-slate-600 font-medium">Active Learners</p>
        </div>

        <div className="card card-hover p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">4.9/5</h3>
          <p className="text-slate-600 font-medium">Average Rating</p>
        </div>
      </section>

      {/* User Dashboard Links */}
      {isAuth && (
        <section className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200/60">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Welcome back, {user?.email?.split('@')[0]}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user?.roles?.includes('student') && (
              <Link
                to="/dashboard"
                className="group bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">My Learning</h3>
                <p className="text-blue-100">Continue your courses and track progress</p>
              </Link>
            )}

            {user?.roles?.includes('collaborator') && (
              <Link
                to="/collab/dashboard"
                className="group bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Create Courses</h3>
                <p className="text-green-100">Build and manage your educational content</p>
              </Link>
            )}

            {user?.roles?.includes('admin') && (
              <Link
                to="/admin/dashboard"
                className="group bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
                <p className="text-orange-100">Manage platform and review content</p>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      {!isAuth && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Learn at Your Pace</h3>
            <p className="text-slate-600 leading-relaxed">Access courses anytime, anywhere. Our flexible learning platform adapts to your schedule.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Expert Instructors</h3>
            <p className="text-slate-600 leading-relaxed">Learn from industry professionals with years of experience in their respective fields.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Certified Learning</h3>
            <p className="text-slate-600 leading-relaxed">Earn recognized certificates upon course completion to showcase your new skills.</p>
          </div>
        </section>
      )}
    </div>
  );
}
