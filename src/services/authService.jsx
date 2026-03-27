const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Request failed.";
    throw new Error(message);
  }

  return payload;
}

function saveAuthSession(token, user) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export const authService = {
  async register(userData) {
    const payload = await request("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    saveAuthSession(payload?.token, payload?.user);
    return payload;
  },

  async login(credentials) {
    const payload = await request("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    saveAuthSession(payload?.token, payload?.user);
    return payload;
  },

  async getProfile() {
    return request("/profile");
  },

  async getUsers() {
    return request("/users");
  },

  async getUserById(id) {
    return request(`/users/${id}`);
  },

  async createUser(data) {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(id, data) {
    return request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id) {
    return request(`/users/${id}`, { method: "DELETE" });
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem("app_role");
    localStorage.removeItem("client_entry_page");
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
