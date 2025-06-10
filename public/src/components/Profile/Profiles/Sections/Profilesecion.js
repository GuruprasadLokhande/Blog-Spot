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
    setInputData((prev) => {
      return { ...prev, [name]: value };
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
        "Accept": "application/json",
        "Content-Type": "application/json"
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
        setProfileData(data.userData);
        setInputData({
          name: data.userData.name || "",
          email: data.userData.email || "",
          location: data.userData.location || "",
          website: data.userData.website || "",
          bio: data.userData.bio || "",
          otp: ""
        });
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
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        email: inputData.email,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to send OTP");
        }
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
          setMessage("OTP Sent Successfully!");
        } else {
          throw new Error("Failed to send OTP");
        }
      })
      .catch((err) => {
        setSmallLoader(false);
        console.error('OTP error:', err);
        setOtpSend(false);
        setNewEmail(false);
        setIsMesssage(true);
        setMessageType("error");
        setMessage(err.message || "Failed to send OTP");
      });
  };

  const updateHandler = (e) => {
    e.preventDefault();
    setSmallLoader(true);
    setError("");

    const url = apiUrl + "/profile/editprofile";
    fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        name: inputData.name || profileData.name,
        email: inputData.email || profileData.email,
        location: inputData.location || profileData.location,
        website: inputData.website || profileData.website,
        bio: inputData.bio || profileData.bio,
        otp: inputData.otp,
        isOtp: isOtpSend
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
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
        setProfileData(data.userData);
        setSmallLoader(false);
        setIsMesssage(true);
        setMessageType("message");
        setMessage("Profile updated successfully!");
        setInputData({
          name: "",
          email: "",
          location: "",
          website: "",
          bio: "",
          otp: ""
        });
        setOtpSend(false);
        setNewEmail(false);
      })
      .catch((err) => {
        console.error('Profile update error:', err);
        setError(err.message);
        setSmallLoader(false);
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
            <h3>Profile</h3>
            {isSmallLaoder && (
              <div className={styles["small-loader"]}>
                <LoaderSmall />
              </div>
            )}
            <form onSubmit={updateHandler}>
              <div className={styles["profile-sub"]}>
                <div className={styles["input-section"]}>
                  <div className={styles["section"]}>
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder={profileData.name}
                      value={inputData.name}
                      onChange={inputHandler}
                    />
                  </div>
                  <div className={`${styles["section"]} ${!isEmailValid ? styles["invalid"] : ""}`}>
                    <label htmlFor="email">Email</label>
                    {isOtpSend ? (
                      <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder={profileData.email}
                        value={inputData.email}
                        onChange={inputHandler}
                        readOnly
                      />
                    ) : (
                      <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder={profileData.email}
                        value={inputData.email}
                        onChange={inputHandler}
                      />
                    )}
                  </div>
                  {isNewEmail && (
                    <div className={styles["button"]}>
                      <button type="button" onClick={otpHandler}>
                        Send OTP
                      </button>
                    </div>
                  )}
                  {isOtpSend && (
                    <div className={styles["section"]}>
                      <label htmlFor="otp">OTP</label>
                      <input
                        type="text"
                        name="otp"
                        id="otp"
                        placeholder="Enter OTP"
                        value={inputData.otp}
                        onChange={inputHandler}
                      />
                    </div>
                  )}
                  {!isNewEmail && (
                    <Fragment>
                      <div className={styles["section"]}>
                        <label htmlFor="location">Location</label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          placeholder={profileData.location}
                          value={inputData.location}
                          onChange={inputHandler}
                        />
                      </div>
                      <div className={styles["section"]}>
                        <label htmlFor="website">Website</label>
                        <input
                          type="text"
                          name="website"
                          id="website"
                          placeholder={profileData.website}
                          value={inputData.website}
                          onChange={inputHandler}
                        />
                      </div>
                      <div className={styles["section"]}>
                        <label htmlFor="bio">Bio</label>
                        <textarea
                          name="bio"
                          id="bio"
                          placeholder={profileData.bio}
                          value={inputData.bio}
                          onChange={inputHandler}
                        />
                      </div>
                    </Fragment>
                  )}
                </div>
              </div>
              {!isNewEmail && (
                <div className={styles["button"]}>
                  <button type="submit">Update Profile</button>
                </div>
              )}
            </form>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default ProfileSection;
