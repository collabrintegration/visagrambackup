import React, { createContext, useContext } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";

interface AuthUser {
  id: string;
  name: string;
  profileImageUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetCurrentAuthUser();

  const user: AuthUser | null = data?.user
    ? {
        id: String(data.user.id ?? ""),
        name: String(data.user.name ?? data.user.username ?? "Traveler"),
        profileImageUrl: typeof data.user.profileImageUrl === "string" ? data.user.profileImageUrl : null,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
