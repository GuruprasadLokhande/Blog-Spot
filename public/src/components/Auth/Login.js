import { Link } from "react-router-dom";
import styles from "./Auth.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import LoaderForAuth from "../Loader/LoaderForAuth";
import blogLogo from "../../media/bloglogo.png";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const Login = (props) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  let data = state?.message || "";

  const [inputData, setInputData] = useState({
    email: "",
    password: "",
  });

  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputDataHandler = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmailError(false);
    }
    if (name === "password") {
      setPassError(false);
    }

    setInputData((prev) => {
      return { ...prev, [name]: value };
    });

    setIsError(false);
  };

  const loginHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    // Validate input
    if (!inputData.email.includes("@") || inputData.email.length < 8) {
      setEmailError(true);
      setMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    if (inputData.password.length < 6) {
      setPassError(true);
      setMessage("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: inputData.email,
          password: inputData.password,
        }),
      });

      console.log("Login response:", {
        status: response.status,
        ok: response.ok,
        data: await response.clone().json()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.message || "Login failed");
      }

      const data = await response.json();
      
      if (data.message === "login success") {
        console.log("Login successful, setting user data");
        localStorage.setItem("isLogin", "yes");
        if (data.user) {
          localStorage.setItem("userName", data.user.name);
        }
        props.isLogin(true);
        navigate("/");
      } else {
        throw new Error(data.errors?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsError(true);
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-main"]}>
      <div className={styles["login-sub"]}>
        <div className={styles["title"]}>
          <Link to="/">
            <img src={blogLogo} alt="logo"></img>
          </Link>
          <Link to="/">
            <h3>
              Blog<span>Sp</span>ot
            </h3>
          </Link>
        </div>
        <h3 className={styles["login"]}>Login</h3>
        <p className={styles["signup"]}>
          Doesn't have account yet?
          <Link to="/signup">
            <span>Sign Up</span>
          </Link>
        </p>
        <form method="post" onSubmit={loginHandler}>
          <div className={styles["input-section"]}>
            <div
              className={`${styles["email"]} ${
                emailError ? styles["invalid"] : ""
              }`}
            >
              <label htmlFor="email">Email Address</label>
              <input
                onChange={inputDataHandler}
                type="email"
                name="email"
                value={inputData.email}
                autoComplete="username"
                placeholder="your@example.com"
                id="email"
              ></input>
            </div>
            <div
              className={`${styles["password"]} ${
                passError ? styles["invalid"] : ""
              }`}
            >
              <label htmlFor="pass">Password</label>
              <input
                onChange={inputDataHandler}
                type="password"
                name="password"
                autoComplete="current-password"
                value={inputData.password}
                placeholder="Enter 6 character or more "
                id="pass"
              ></input>
              <Link to="/forgotpassword">
                <p className={styles["forgot"]}>Forgot Password</p>
              </Link>
            </div>
          </div>
          {isLoading ? (
            <button className={styles["btn"]} type="button" disabled>
              <LoaderForAuth />
            </button>
          ) : (
            <button className={styles["btn"]} type="submit">
              Login
            </button>
          )}
        </form>
        {isError && <p className={styles["message"]}>{message}</p>}
        {data.length > 4 ? (
          <p className={styles["verify-message"]}>{data}</p>
        ) : (
          ""
        )}
      </div>

      <div className={styles["design"]}></div>
    </div>
  );
};

export default Login;
