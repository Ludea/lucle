import { useContext, createContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Context
import { LucleRPC } from "context/Luclerpc";

// RPC
import { connection } from "utils/rpc";

import { Platforms } from "gen/speedupdate_pb";

const AuthContext = createContext();

function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [repositories, setRepositories] = useState(() => {
    const savedRepo = localStorage.getItem("repositories");
    return savedRepo
      ? new Map(Object.entries(JSON.parse(savedRepo)))
      : new Map();
  });
  const navigate = useNavigate();
  const client = useContext(LucleRPC);

  const Login = async (credentials) =>
    new Promise((resolve, reject) => {
      connection(client, credentials.username, credentials.password)
        .then((user) => {
          let list_repo = new Map<string, string[]>();
          let list_platforms: string[] = [];
          for (const repo of user.repositories) {
            for (const host of repo.platforms) {
              switch (host) {
                case Platforms.WIN64:
                  list_platforms.push("win64");
                  break;
                case Platforms.MACOS_X86_64:
                  list_platforms.push("macos_x86_64");
                  break;
                case Platforms.MACOS_ARM64:
                  list_platforms.push("macos_arm64");
                  break;
                case Platforms.LINUX:
                  list_platforms.push("linux");
                  break;
              }
            }
            list_repo.set(repo.path, list_platforms);
            list_platforms = [];
          }
          setUsername(user.username);
          setToken(user.token);
          localStorage.setItem("token", user.token);
          localStorage.setItem("username", user.username);
          setRepositories(list_repo);
          localStorage.setItem(
            "repositories",
            JSON.stringify(Object.fromEntries(list_repo)),
          );
          navigate("/list");
        })
        .catch((err) => {
          reject(err);
        });
    });

  const Logout = () => {
    const emptyMap = new Map();
    setToken("");
    setUsername("");
    setRepositories(emptyMap);
    localStorage.removeItem("token");
    localStorage.removeItem("repositories");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ username, token, repositories, Login, Logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

export const useAuth = () => useContext(AuthContext);
