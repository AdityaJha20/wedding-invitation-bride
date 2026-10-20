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

// A single celebration moment, as delivered by the server for one invitation
export interface CelebrationEvent {
  id: string;
  time: string;
  title: string;
  sanskrit: string;
  subtitle: string;
  icon: string;
  startsAt: string;
}

export interface CelebrationDay {
  date: string;
  isoDate: string;
  dayOfWeek: string;
  badge?: string;
  events: CelebrationEvent[];
}

export interface InvitationPreset {
  id: string;
  label: string;
  eventIds: string[];
}

export interface InvitationRecord {
  id: string;
  guestName: string;
  allowedEventIds: string[];
  token: string;
  isActive: boolean;
  revokedAt: string | null;
  notes: string;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationInput {
  guestName: string;
  allowedEventIds: string[];
  notes: string;
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
        status: res.status,
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

  // Public Personalized Invitation (only the guest's permitted events)
  getInvitation: async (
    token: string
  ): Promise<ApiResponse<{ invitation: { schedule: CelebrationDay[] } }>> => {
    return request(`/api/invitations/${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  // Admin Invitation Management
  getAdminEvents: async (): Promise<
    ApiResponse<{ days: CelebrationDay[]; presets: InvitationPreset[] }>
  > => {
    return request('/api/admin/events', {
      method: 'GET',
    });
  },

  getAdminInvitations: async (): Promise<
    ApiResponse<{ invitations: InvitationRecord[]; count: number }>
  > => {
    return request('/api/admin/invitations', {
      method: 'GET',
    });
  },

  createInvitation: async (
    input: InvitationInput
  ): Promise<ApiResponse<{ invitation: InvitationRecord }>> => {
    return request('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateInvitation: async (
    id: string,
    input: InvitationInput
  ): Promise<ApiResponse<{ invitation: InvitationRecord }>> => {
    return request(`/api/admin/invitations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  previewInvitation: async (
    id: string
  ): Promise<ApiResponse<{ invitation: { schedule: CelebrationDay[] } }>> => {
    return request(`/api/admin/invitations/${encodeURIComponent(id)}/preview`, {
      method: 'GET',
    });
  },

  revokeInvitation: async (id: string): Promise<ApiResponse<{ invitation: InvitationRecord }>> => {
    return request(`/api/admin/invitations/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  regenerateInvitation: async (
    id: string
  ): Promise<ApiResponse<{ invitation: InvitationRecord }>> => {
    return request(`/api/admin/invitations/${encodeURIComponent(id)}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
