import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Fragment, useEffect, useState } from "react";
import "./App.css";
import Blog from "./components/Blogsection/Blog";
import Header from "./components/Header/Header";
import Singlepost from "./components/Singlepost/Singlepost";
import Footer from "./components/Footer/Footer";
import Profile from "./components/Profile/Profile";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import ForgotPassEmail from "./components/Auth/ForgotPasswordEmail";
import ResetPass from "./components/Auth/ResetPassword";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const App = () => {
  const location = useLocation();
  const loginValue = localStorage.getItem("isLogin");
  const loginStatus = loginValue === "yes" ? true : false;
  const [isLogin, setIsLogin] = useState(loginStatus);
  const [posts, setPosts] = useState([]);
  const [postCategory, setPostCategory] = useState([]);
  const [isLoader, setLoader] = useState(false);
  const [searchData, setSearchData] = useState("");
  const [isMessage, setIsMesssage] = useState(false);
  const [message, setMessage] = useState("");

  const [pages, setPages] = useState({
    totalItem: 0,
    totalPage: 0,
    currentPage: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const categoryHandler = () => {
    setSearchData("");
    setCurrentPage(1);
  };

  const searchDataHandler = (value) => {
    setSearchData(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const url = apiUrl + "/auth/verifytoken";

    const authVerify = async () => {
      try {
        const response = await fetch(url, {
          method: "post",
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        const data = await response.json();
        setSearchData("");
        
        if (data.message === "valid auth") {
          setIsLogin(true);
          localStorage.setItem("isLogin", "yes");
        } else {
          setIsLogin(false);
          localStorage.removeItem("isLogin");
          logoutHandler("session");
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        setIsLogin(false);
        localStorage.removeItem("isLogin");
        logoutHandler("session");
      }
    };

    // Check if we have a login token in localStorage
    const getLocalData = localStorage.getItem("isLogin");
    if (getLocalData === "yes") {
      authVerify();
    }
  }, []);

  const logoutHandler = async (type = "") => {
    try {
      const url = apiUrl + "/auth/logout";
      const response = await fetch(url, { 
        method: "GET", 
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear all local storage
      localStorage.clear();
      setIsLogin(false);
      navigate("/");
    } catch (err) {
      console.error('Logout error:', err);
      // Even if the server request fails, clear local state
      localStorage.clear();
      setIsLogin(false);
      navigate("/");
    }

    if (type === "session") {
      setIsMesssage(true);
      setMessage("Your login session has expired. Please log in again.");
    }
    if (type === "cookie-issue") {
      setIsMesssage(true);
      setMessage(
        "Cookies are not enabled in your browser. Please enable them to access your profile."
      );
    }
  };

  const loginHandler = (value) => {
    setIsLogin(value);
  };

  useEffect(() => {
    const url = apiUrl + "/public/getcategory";
    console.log('Fetching categories from:', url);
    fetch(url, {
      method: "GET"
    })
      .then((response) => {
        console.log('Categories response status:', response.status);
        if (!response.ok) {
          throw new Error("server error");
        }
        return response.json();
      })
      .then((data) => {
        console.log('Categories data received:', data);
        setPostCategory(data.postCategory);
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        setPostCategory([]);
      });
  }, []);

  useEffect(() => {
    setLoader(true);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const queryParams = new URLSearchParams(location.search);
    let cat = queryParams.get("catId");
    if (!cat) {
      cat = "All";
    }

    const url =
      apiUrl +
      "/public/getpost?page=" +
      currentPage +
      "&catId=" +
      cat +
      "&search=" +
      searchData +
      "&timeZone=" +
      userTimezone;

    fetch(url, { 
      method: "GET"
    })
      .then((response) => {
        if (!response.ok) {
          const error = new Error("server error");
          throw error;
        }
        return response.json();
      })
      .then((data) => {
        setLoader(false);
        setPages({
          totalItem: data.totalItem,
          totalPage: data.totalPage,
          currentPage: Number(data.currentPage),
        });
        setPosts(data.posts);
      })
      .catch((err) => {
        console.log(err);
        setPosts([]);
        setLoader(false);
      });
  }, [currentPage, searchData, location.search]);

  const currentPageHandler = (value) => {
    setCurrentPage(value);
  };

  const crossHandler = (value) => {
    setIsMesssage(value);
  };

  return (
    <Fragment>
      <Header
        isLogin={isLogin}
        logout={logoutHandler}
        crossHandler={crossHandler}
        message={message}
        isMessage={isMessage}
      />
      <Routes>
        <Route
          path="/login"
          element={
            !isLogin ? (
              <Login isLogin={loginHandler} logout={logoutHandler} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isLogin ? (
              <Signup />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/forgotpassword"
          element={
            !isLogin ? (
              <ForgotPassEmail />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            <Blog
              posts={posts}
              pages={pages}
              currentPageHandler={currentPageHandler}
              isLoader={isLoader}
              postCategory={postCategory}
              categoryHandler={categoryHandler}
              searchDataHandler={searchDataHandler}
            />
          }
        />
        <Route 
          path="/post" 
          element={
            isLogin ? (
              <Singlepost />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route
          path="/profile"
          element={
            isLogin ? (
              <Profile postCategory={postCategory} logout={logoutHandler} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/resetpassword"
          element={
            !isLogin ? (
              <ResetPass />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
      <Footer />
    </Fragment>
  );
};

export default App;
