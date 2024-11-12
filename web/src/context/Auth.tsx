import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// Context
import { LucleRPC } from "context";

// RPC
import { connection } from "utils/rpc";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [repositories, setRepositories] = useState(
    JSON.parse(localStorage.getItem("repositories")),
  );
  const navigate = useNavigate();
  const client = useContext(LucleRPC);

  const Login = async (credentials) =>
    new Promise((resolve, reject) => {
      connection(client, credentials.username, credentials.password)
        .then((user) => {
          setUsername(user.username);
          setToken(user.token);
          localStorage.setItem("token", user.token);
          localStorage.setItem("username", user.username);
          setRepositories(user.repositories);
          localStorage.setItem(
            "repositories",
            JSON.stringify(user.repositories),
          );
          navigate("/admin/speedupdate");
        })
        .catch((err) => reject(err));
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
