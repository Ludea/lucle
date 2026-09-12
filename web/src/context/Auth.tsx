import { useContext, createContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router";

import { LucleRPC } from "context/Luclerpc";
import { connection } from "utils/rpc";
import { Platforms } from "gen/speedupdate_pb";

const AuthContext = createContext<any>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]       = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const navigate = useNavigate();
  const client   = useContext(LucleRPC);

  const Login = async (credentials: { username: string; password: string }) =>
    new Promise((resolve, reject) => {
      connection(client, credentials.username, credentials.password)
        .then((user) => {
          const list_repo = new Map<string, string[]>();

          for (const repo of user.repositories ?? []) {
            const list_platforms: string[] = [];
            for (const host of repo.platforms ?? []) {
              switch (host) {
                case Platforms.WIN64:          list_platforms.push("win64");         break;
                case Platforms.MACOS_X86_64:   list_platforms.push("macos_x86_64");  break;
                case Platforms.MACOS_ARM64:    list_platforms.push("macos_arm64");   break;
                case Platforms.LINUX:          list_platforms.push("linux");          break;
              }
            }
            list_repo.set(repo.path, list_platforms);
          }

          setToken(user.token);
          setUsername(user.username);
          localStorage.setItem("token", user.token);
          localStorage.setItem("username", user.username);
          resolve(user);
          navigate("/dashboard");
        })
        .catch((err) => {
          reject(err);
        });
    });

  const Logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ username, token, Login, Logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
