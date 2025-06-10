import { Fragment, useEffect, useState } from "react";
import styles from "./Profilesection.module.css";
import { useNavigate } from "react-router-dom";
import LoaderBig from "../../../Loader/LoaderBig";
import LoaderSmall from "../../../Loader/LoaderSmall";
import Message from "../../../Message/Message";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const ProfileSection = (props) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({});
  const [isLoader, setLoader] = useState(false);
  const [isSmallLaoder, setSmallLoader] = useState(false);
  const [inputData, setInputData] = useState({
    name: "",
    email: "",
    location: "",
    website: "",
    bio: "",
    otp: "",
  });

  const [isEmailValid, setEmailValid] = useState(true);
  const [isNewEmail, setNewEmail] = useState(false);
  const [isOtpSend, setOtpSend] = useState(false);
  const [message, setMessage] = useState("");
  const [isMessage, setIsMesssage] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [error, setError] = useState("");

  const crossHandler = (value) => {
    setIsMesssage(value);
  };

  const emailValidHandler = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return isValid;
  };

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setInputData((pre) => {
      return { ...pre, [name]: value };
    });
    setNewEmail(false);
    setEmailValid(true);
  };

  useEffect(() => {
    setLoader(true);
    setError("");
    const url = apiUrl + "/profile/profile";
    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required");
          }
          throw new Error("Failed to fetch profile");
        }
        return response.json();
      })
      .then((data) => {
        if (data?.error === "yes") {
          throw new Error(data.message || "Failed to fetch profile");
        }
        setProfileData(data);
        setLoader(false);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
        setError(err.message);
        setLoader(false);
        if (err.message === "Authentication required") {
          navigate("/login", { 
            state: { message: "Please login to view your profile" }
          });
        }
      });
  }, [navigate]);

  useEffect(() => {
    const interval = setTimeout(() => {
      const isEmailValid = emailValidHandler(inputData.email.trim());
      if (
        profileData.email !== inputData.email &&
        inputData.email.length > 1 &&
        isEmailValid &&
        !isOtpSend
      ) {
        setNewEmail(true);
      } else {
        setNewEmail(false);
      }
    }, 1000);

    return () => {
      clearTimeout(interval);
    };
  }, [inputData.email, profileData.email, isOtpSend]);

  const otpHandler = () => {
    const emailValid = emailValidHandler(inputData.email);
    setSmallLoader(true);
    if (!emailValid) {
      setEmailValid(false);
      return;
    }

    const url = apiUrl + "/profile/genotp";
    const email = inputData.email;
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        email: email,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setSmallLoader(false);
        if (data?.data === "invalid token") {
          props.logout("session");
        } else if (data.message === "otp send") {
          setOtpSend(true);
          setNewEmail(false);
          setIsMesssage(true);
          setMessageType("message");
          setMessage("OTP Send");
        } else {
          throw new Error("OTP Send Failed");
        }
      })
      .catch((err) => {
        setSmallLoader(false);
        console.log(err);
        setOtpSend(false);
        setNewEmail(false);
        setIsMesssage(true);
        setMessageType("error");
        setMessage("OTP Send Failed.");
      });
  };

  const updateHandler = (e) => {
    e.preventDefault();
    setLoader(true);
    setError("");
    const url = apiUrl + "/profile/updateprofile";
    const formData = new FormData(e.target);

    fetch(url, {
      method: "PUT",
      body: formData,
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required");
          }
          throw new Error("Failed to update profile");
        }
        return response.json();
      })
      .then((data) => {
        if (data?.error === "yes") {
          throw new Error(data.message || "Failed to update profile");
        }
        setProfileData(data);
        setLoader(false);
        setIsMesssage(true);
        setMessageType("message");
        setMessage("Profile updated successfully!");
      })
      .catch((err) => {
        console.error('Profile update error:', err);
        setError(err.message);
        setLoader(false);
        setIsMesssage(true);
        setMessageType("error");
        setMessage(err.message);
        if (err.message === "Authentication required") {
          navigate("/login", { 
            state: { message: "Please login to update your profile" }
          });
        }
      });
  };

  return (
    <Fragment>
      {isLoader && (
        <div className={styles["loader"]}>
          <LoaderBig />
        </div>
      )}
      {error && (
        <div className={styles["error"]}>
          <p>{error}</p>
        </div>
      )}
      {!isLoader && !error && (
        <Fragment>
          {isMessage && (
            <div className={styles["message"]}>
              <Message
                type={messageType}
                message={message}
                cross={crossHandler}
              />
            </div>
          )}
          <div className={styles["profile-main"]}>
            <form onSubmit={updateHandler}>
              <div className={styles["profile-sub"]}>
                <div className={styles["image-section"]}>
                  <img
                    src={profileData.image || "https://img.icons8.com/ios/50/user--v1.png"}
                    alt="profile"
                  ></img>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    id="image"
                  ></input>
                  <label htmlFor="image">Change Photo</label>
                </div>
                <div className={styles["input-section"]}>
                  <div className={styles["input"]}>
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={profileData.name}
                      required
                    ></input>
                  </div>
                  <div className={styles["input"]}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={profileData.email}
                      required
                    ></input>
                  </div>
                  <div className={styles["input"]}>
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      name="bio"
                      id="bio"
                      defaultValue={profileData.bio}
                    ></textarea>
                  </div>
                  <button type="submit">Update Profile</button>
                </div>
              </div>
            </form>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default ProfileSection;
