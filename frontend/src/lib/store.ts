
import { getBrowserInfo } from "./ist-utils";

export type Plan = 'Free' | 'Bronze' | 'Silver' | 'Gold';

export interface UserSession {
  id: string;
  browser: string;
  os: string;
  device: 'desktop' | 'laptop' | 'mobile';
  ip: string;
  timestamp: string;
}

export interface UserState {
  isLoggedIn: boolean;
  email: string;
  phone: string;
  subscription: Plan;
  tweetCount: number;
  loginHistory: UserSession[];
  lastPasswordReset: string | null;
  notificationsEnabled: boolean;
  language: string;
}

const DEFAULT_USER: UserState = {
  isLoggedIn: false,
  email: 'user@example.com',
  phone: '+91 9876543210',
  subscription: 'Free',
  tweetCount: 0,
  loginHistory: [],
  lastPasswordReset: null,
  notificationsEnabled: true,
  language: 'English',
};

export const getStore = (): UserState => {
  if (typeof window === 'undefined') return DEFAULT_USER;
  const data = localStorage.getItem('chirppro_store');
  return data ? JSON.parse(data) : DEFAULT_USER;
};

export const updateStore = (updates: Partial<UserState>) => {
  if (typeof window === 'undefined') return;
  const current = getStore();
  const next = { ...current, ...updates };
  localStorage.setItem('chirppro_store', JSON.stringify(next));
  window.dispatchEvent(new Event('storage'));
};

export const addLoginHistory = (ip: string = '157.34.122.9') => {
  const { browser, os, deviceType } = getBrowserInfo();
  const session: UserSession = {
    id: Math.random().toString(36).substr(2, 9),
    browser,
    os,
    device: deviceType,
    ip,
    timestamp: new Date().toISOString(),
  };
  const history = [session, ...getStore().loginHistory].slice(0, 10);
  updateStore({ loginHistory: history, isLoggedIn: true });
};
