import React, { useEffect, useState } from 'react';

const apiUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:3030";

const Profilesecion = ({ logout }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${apiUrl}/profile/profile`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Session expired, logging out...");
            logout("session");
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message);
        if (err.message.includes("Authentication required") || err.message.includes("401")) {
          logout("session");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [logout]);

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!profileData) {
    return <div>No profile data available</div>;
  }

  return (
    <div className="profile-section">
      <h2>Profile Information</h2>
      <div className="profile-details">
        <p><strong>Name:</strong> {profileData.name}</p>
        <p><strong>Email:</strong> {profileData.email}</p>
        {/* Add more profile information as needed */}
      </div>
    </div>
  );
};

export default Profilesecion; 