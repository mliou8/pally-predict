import { usePrivy } from '@privy-io/react-auth';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
  privyUserId?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (privyUserId) {
    headers['x-privy-user-id'] = privyUserId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(error.error || 'Request failed', response.status);
  }

  return response;
}

export function useAuthenticatedRequest() {
  const { user } = usePrivy();

  return async (url: string, options: RequestInit = {}) => {
    if (!user?.id) {
      throw new Error('Not authenticated');
    }
    return apiRequest(url, options, user.id);
  };
}
