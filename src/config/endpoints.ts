export const endpoints = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  students: "/api/students",
  student: (id: string) => `/api/students/${id}`,
  studentHistory: (id: string) => `/api/students/${id}/history`,
  dyslexiaAssessment: "/api/assessments/dyslexia",
  dysgraphiaAssessment: "/api/assessments/dysgraphia",
  adhdAssessment: "/api/assessments/adhd",
  behaviour: "/api/behaviour",
  analytics: "/api/analytics",
  report: (id: string) => `/api/reports/${id}`,
  reports: "/api/reports",
};
