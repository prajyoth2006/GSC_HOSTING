import React from 'react';
import ProfileCard from '../components/ProfileCard';

const Profile = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Profile Card Container */}
        <div className="w-full">
          <ProfileCard />
        </div>

      </div>
    </div>
  );
};

export default Profile;