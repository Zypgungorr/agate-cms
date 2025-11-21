// Authentication API functions
const API_BASE_URL = 'http://localhost:5135/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  title?: string;
  office?: string;
  roles: string[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  office?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Login API call
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

// Register API call
export async function register(userData: RegisterRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}

// Get user profile
export async function getProfile(): Promise<User> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

// Token management
export function saveAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function removeAuthToken(): void {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Logout function
export function logout(): void {
  removeAuthToken();
}

// Type alias for UserProfile
export type UserProfile = User;
