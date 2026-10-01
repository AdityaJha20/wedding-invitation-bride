// API Client for Manya & Sarthak Wedding Platform

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface WishRecord {
  _id?: string;
  name: string;
  wishes: string;
  createdAt: string;
}

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include', // Ensure HttpOnly cookies are attached across requests
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Request failed with status ${res.status}`,
      };
    }

    return (
      data || {
        success: true,
      }
    );
  } catch (error) {
    console.error(`[API Error] Request to ${endpoint} failed:`, error);
    return {
      success: false,
      message: 'Unable to reach the server. Please check your internet connection.',
    };
  }
};

export const apiClient = {
  // Public Guest Wish Submission
  submitWish: async (name: string, wishes: string): Promise<ApiResponse> => {
    return request('/api/wishes', {
      method: 'POST',
      body: JSON.stringify({ name, wishes }),
    });
  },

  // Admin Authentication
  adminLogin: async (email: string, password: string): Promise<ApiResponse> => {
    return request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  adminLogout: async (): Promise<ApiResponse> => {
    return request('/api/admin/logout', {
      method: 'POST',
    });
  },

  getAdminMe: async (): Promise<ApiResponse> => {
    return request('/api/admin/me', {
      method: 'GET',
    });
  },

  getAdminWishes: async (): Promise<ApiResponse<{ wishes: WishRecord[]; count: number }>> => {
    return request('/api/admin/wishes', {
      method: 'GET',
    });
  },
};
