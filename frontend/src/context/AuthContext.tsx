import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);

  const login = async (email: string, password: string) => {
    // TODO: Implement login with Supabase
    console.log("Login:", email);
  };

  const logout = async () => {
    // TODO: Implement logout with Supabase
    setUser(null);
  };

  const signup = async (email: string, password: string) => {
    // TODO: Implement signup with Supabase
    console.log("Signup:", email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
