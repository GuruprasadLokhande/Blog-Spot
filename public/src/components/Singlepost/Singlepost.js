import LoaderBig from "../Loader/LoaderBig";
import styles from "./Singlepost.module.css";
import { Fragment, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const Singlepost = () => {
  const navigate = useNavigate();
  const [postsData, setPostData] = useState({
    post: { post: { user: {} } },
    createDate: "",
    updateDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    let title = params.get("title");
    let id = params.get("id");
    const url = apiUrl + "/public/getsinglepost";
    
    if (title && id) {
      fetch(url, {
        method: "post",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          title: title,
          postId: id,
          timeZone: userTimezone,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Authentication required");
            }
            throw new Error("Post not available");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            setPostData(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Error fetching post:', err);
          setError(err.message);
          setIsLoading(false);
          if (err.message === "Authentication required") {
            navigate("/login", { 
              state: { message: "Please login to view this post" }
            });
          }
        });
    } else {
      setError("Invalid post URL");
      setIsLoading(false);
    }
  }, [navigate]);

  const sanitizedContent = DOMPurify.sanitize(postsData.post.post.content);

  return (
    <Fragment>
      {isLoading && (
        <div className={styles["loader"]}>
          <LoaderBig />
        </div>
      )}
      {error && (
        <div className={styles["error"]}>
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && postsData.post.createDate && (
        <div className={styles["post-main"]}>
          <div className={styles["post-sub"]}>
            <div className={styles["title-section"]}>
              <div className={styles["title"]}>
                <h1>{postsData.post.post.title}</h1>
                <p className={styles["desc"]}>{postsData.post.post.desc}</p>
                <p className={styles["name"]}>
                  Written by: <span> {postsData.post.post.user.name}</span>
                </p>
                <div className={styles["date"]}>
                  <p>Published: {postsData.post.createDate}</p>
                  {postsData.post.updateDate && (
                    <p>Updated: {postsData.post.updateDate}</p>
                  )}
                  <div className={styles["views"]}>
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/ios/50/visible--v1.png"
                      alt="visible--v1"
                    />
                    <p> {postsData.post.post.views}</p>
                  </div>
                </div>
              </div>
              <div className={styles["image-section"]}>
                <img
                  width="500px"
                  height="400px"
                  src={postsData.post.post.image}
                  alt={postsData.post.post.imageName}
                ></img>
                <p>{postsData.post.post.imgSource}</p>
              </div>
            </div>
          </div>
          <div className={styles["text-section-main"]}>
            <div
              className={styles["text-section"]}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            ></div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Singlepost;
