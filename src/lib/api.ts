const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        },
        credentials: 'include',
        ...options,
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
        throw new Error(body?.message || res.statusText || 'Request failed');
    }
    return body;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    grad: [string, string];
    focus: string;
}

export interface AuthResult {
    token: string;
    user: AuthUser;
    data: any;
}

export async function loginApi(email: string, password: string) {
    return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }) as Promise<AuthResult>;
}

export async function registerApi(name: string, email: string, password: string) {
    return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    }) as Promise<AuthResult>;
}

export async function getMeApi(token: string) {
    return request('/api/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    }) as Promise<{ user: AuthUser }>;
}

export async function fetchDataApi(token: string) {
    return request('/api/data', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    }) as Promise<any>;
}

export async function saveDataApi(token: string, data: any) {
    return request('/api/data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
}

export async function importDataApi(token: string, raw: string) {
    return request('/api/data/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: raw,
    });
}

export async function resetWorkspaceApi(token: string) {
    return request('/api/data/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function fetchUsersApi() {
    return request('/api/auth/users', {
        method: 'GET',
    }) as Promise<{ users: AuthUser[] }>;
}
