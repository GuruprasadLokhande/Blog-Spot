import React, { useEffect, useState } from 'react';

const Profilesecion = () => {
  const [profileData, setProfileData] = useState([]);
  const [logout, setLogout] = useState(() => () => {});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(apiUrl + "/profile/profile", {
          method: "GET",
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout("session");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.message === "Authentication required") {
          logout("session");
        }
      }
    };

    fetchProfile();
  }, [logout]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Profilesecion; 