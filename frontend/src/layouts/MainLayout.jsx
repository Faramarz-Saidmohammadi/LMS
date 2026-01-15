import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { authApi } from "../api/auth.api";
import { getHttpErrorMessage } from "../utils/httpError";

export default function MainLayout() {
  const { isAuth, user, clearAuth } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      await authApi.logout();
      clearAuth();
    } catch (e) {
      alert(getHttpErrorMessage(e));
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LearnHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/courses"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/courses')
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Courses
              </Link>

              {isAuth && user?.roles?.includes('student') && (
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  My Learning
                </Link>
              )}

              {isAuth && user?.roles?.includes('collaborator') && (
                <Link
                  to="/collab/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/collab/dashboard')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Create
                </Link>
              )}

              {isAuth && user?.roles?.includes('admin') && (
                <Link
                  to="/admin/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/admin/dashboard')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuth ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-slate-700 font-medium">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        isMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200/60 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {user?.roles?.join(', ') || 'User'}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </Link>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/courses"
                className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive('/courses')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>

              {isAuth && user?.roles?.includes('student') && (
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Learning
                </Link>
              )}

              {isAuth && user?.roles?.includes('collaborator') && (
                <Link
                  to="/collab/dashboard"
                  className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive('/collab/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Courses
                </Link>
              )}

              {isAuth && user?.roles?.includes('admin') && (
                <Link
                  to="/admin/dashboard"
                  className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive('/admin/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
