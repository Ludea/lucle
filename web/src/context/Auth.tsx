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
  const [repositories, setRepositories] = useState();
  const navigate = useNavigate();
  const client = useContext(LucleRPC);

  const Login = async (credentials) =>
    new Promise((resolve, reject) => {
      connection(client, credentials.username, credentials.password)
        .then((user) => {
          let single_repo = new Map<string, string[]>();
          let list_repo_with_platforms: single_repo[] = [];
          let list_platforms: string[] = [];
          for (const repo of user.repositories) {
            for (const host of repo.platforms) {
              switch (host) {
                case Platforms.WIN64:
                  list_platforms.push("win64");
                  break;
              }
            }
            single_repo.set(repo.path, list_platforms);
            list_repo_with_platforms.push(single_repo);
          }
          setUsername(user.username);
          setToken(user.token);
          localStorage.setItem("token", user.token);
          localStorage.setItem("username", user.username);
          //          setRepositories(list_repo_with_platforms);
          //          localStorage.setItem(
          //            "repositories",
          //            JSON.stringify(list_repo_with_platforms),
          //          );
          navigate("/admin/speedupdate");
        })
        .catch((err) => {
          reject(err);
        });
    });

  const Logout = () => {
    setToken("");
    setUsername("");
    setRepositories("");
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
