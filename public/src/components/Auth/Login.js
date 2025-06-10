import { Link } from "react-router-dom";
import styles from "./Auth.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoaderForAuth from "../Loader/LoaderForAuth";
import blogLogo from "../../media/bloglogo.png";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const Login = (props) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [verificationMessage, setVerificationMessage] = useState(state?.message || "");

  const [inputData, setInputData] = useState({
    email: "",
    password: "",
  });

  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clear verification message after 5 seconds
  useEffect(() => {
    if (verificationMessage) {
      const timer = setTimeout(() => {
        setVerificationMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [verificationMessage]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    setMessage("");
  };

  const loginHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);
    setIsError(false);

    // Validate input
    if (!inputData.email || !validateEmail(inputData.email)) {
      setEmailError(true);
      setMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    if (!inputData.password || inputData.password.length < 6) {
      setPassError(true);
      setMessage("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login for:', inputData.email);
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

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonErr) {
        console.error('Error parsing response:', jsonErr);
        throw new Error('Invalid server response');
      }

      console.log('Login response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        if (responseData.error === 'yes' && responseData.errors) {
          if (responseData.errors.message === "Please verify your email before logging in") {
            navigate("/signup", { 
              state: { 
                message: "Please verify your email before logging in. Check your email for the verification code." 
              } 
            });
            return;
          }
          throw new Error(responseData.errors.message || 'Login failed');
        }
        throw new Error(responseData.message || 'Login failed');
      }

      if (responseData.message === "login success" || responseData.message === "login done") {
        console.log('Login successful, setting user data');
        localStorage.setItem("isLogin", "yes");
        if (responseData.user) {
          localStorage.setItem("userName", responseData.user.name);
        }
        props.isLogin(true);
        navigate("/");
      } else {
        throw new Error(responseData.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setIsError(true);
      setMessage(err.message || 'Login failed. Please try again.');
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
        <form method="post" onSubmit={loginHandler} noValidate>
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
                required
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
                required
                minLength="6"
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
        {verificationMessage && (
          <p className={styles["verify-message"]}>{verificationMessage}</p>
        )}
      </div>

      <div className={styles["design"]}></div>
    </div>
  );
};

export default Login;
