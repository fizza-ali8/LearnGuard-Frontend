import { endpoints } from "@/config/endpoints";
import { TEACHER } from "@/lib/constants";
import { api, delay, isDemoMode, isMockApi } from "@/lib/api";

export interface SessionUser {
  name: string;
  email: string;
  role: string;
  school: string;
}

export async function signIn(email: string): Promise<SessionUser> {
  if (!isMockApi()) {
    const { data } = await api.post<SessionUser>(endpoints.login, { email });
    return data;
  }
  await delay(240);
  const demo = email.toLowerCase() === TEACHER.email;
  return {
    name: demo ? TEACHER.name : TEACHER.name,
    email: demo ? TEACHER.email : email,
    role: TEACHER.role,
    school: TEACHER.school,
  };
}

export async function signInDemo(): Promise<SessionUser> {
  return signIn(TEACHER.email);
}

export async function logout() {
  if (!isDemoMode()) {
    await api.post(endpoints.logout).catch(() => undefined);
  }
}

export const authService = {
  login: signIn,
  logout,
  demo: signInDemo,
};
