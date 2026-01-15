import { create } from "zustand";

export const useCourseStore = create((set) => ({
  courses: [],
  currentCourse: null,
  loading: false,
  error: null,

  // Actions
  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch published courses for students
  fetchPublishedCourses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/student/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      set({ courses: data.courses || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch course details
  fetchCourse: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      const course = await response.json();
      set({ currentCourse: course, loading: false });
      return course;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear current course
  clearCurrentCourse: () => set({ currentCourse: null }),
}));