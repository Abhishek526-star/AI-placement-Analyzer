import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export async function apiClient(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  // When sending FormData, the browser must automatically set Content-Type with multipart boundaries
  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok || !body.success) {
    const error = body.error || {
      code: 'REQUEST_FAILED',
      message: response.statusText || 'Request failed.',
    };
    throw error;
  }

  return body.data;
}
