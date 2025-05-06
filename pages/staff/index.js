import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from 'next-auth/react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

// Components
import ShowAvailability from '../../components/staff/ShowAvailability';
import AvailabilityCalendar from '../../components/staff/AvailabilityCalendar';
import AvailabilitySummary from '../../components/staff/AvailabilitySummary';
import BookingSummary from '../../components/staff/BookingSummary';

export default function StaffPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    college: '',
    shoeSize: '',
    dressSize: '',
    phoneNumber: '',
    address: '',
    phone: '',
  });
  const [staffDocRef, setStaffDocRef] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    college: '',
    shoeSize: '',
    dressSize: '',
    phoneNumber: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    // If the session loading is done, update loading state
    if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  // Fetch staff profile from Firebase when session is available
  useEffect(() => {
    async function fetchProfileData() {
      if (session?.user?.email) {
        try {
          // Find matching document if it exists
          const staffCollection = collection(db, 'staff');
          const staffSnapshot = await getDocs(staffCollection);
          const allStaff = staffSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Check if there's a document that matches this email with a different case
          const matchingDoc = allStaff.find(
            staff => staff.email && staff.email.toLowerCase() === session.user.email.toLowerCase()
          );
          
          let docRef;
          
          if (matchingDoc && matchingDoc.id !== session.user.email) {
            // If we found a matching document with different case, use that ID
            docRef = doc(db, 'staff', matchingDoc.id);
          } else {
            // Otherwise use the current email as ID
            docRef = doc(db, 'staff', session.user.email);
          }
          
          setStaffDocRef(docRef);
          
          const staffDoc = await getDoc(docRef);
          
          if (staffDoc.exists()) {
            // If document exists, update state with data
            const data = staffDoc.data();
            
            const profileInfo = {
              college: data.college || '',
              shoeSize: data.shoeSize || '',
              dressSize: data.dressSize || '',
              phoneNumber: data.phoneNumber || '',
              address: data.address || '',
              phone: data.phone || '',
            };
            
            setProfileData(profileInfo);
            setEditedProfile(profileInfo);
          }
        } catch (error) {
          console.error("Error fetching staff profile:", error);
        }
      }
    }
    
    if (session) {
      fetchProfileData();
    }
  }, [session]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    if (staffDocRef) {
      try {
        await updateDoc(staffDocRef, editedProfile);
        setProfileData(editedProfile);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mx-auto"></div>
          <p className="mt-6 text-xl text-pink-600 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login prompt
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border-2 border-pink-500 transform transition-all">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700 mb-6">The Smith Agency</h1>
            <div className="w-full h-0.5 bg-gradient-to-r from-pink-400 to-pink-600 mx-auto mb-8"></div>
            <p className="text-lg text-gray-600 mb-6">Welcome to your staff portal</p>
          </div>
          
          <button
            onClick={() => signIn('google')}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-black hover:from-pink-600 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-150 ease-in-out shadow-lg hover:shadow-xl"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-pink-200 group-hover:text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor" />
              </svg>
            </span>
            Sign in with Google
          </button>
          
          <div className="flex items-center justify-center mt-8">
            <Link href="/" className="text-sm font-medium text-pink-600 hover:text-pink-800 hover:underline transition-all">
              ← Return to home page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Staff dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Mobile-optimized header with user info */}
      <header className="bg-white shadow-md border-b-2 border-pink-500 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">TSA</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-pink-600 truncate">
                The Smith Agency
              </span>
            </Link>
            
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="hidden md:flex space-x-6">
                <Link href="/" className="text-gray-600 hover:text-pink-600 transition-colors">
                  Home
                </Link>
              </div>
              
              <div className="flex items-center bg-white rounded-full shadow-md p-1 border border-pink-300">
                {session.user.image && (
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden border-2 border-pink-500">
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="mx-2 sm:mx-3 hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[100px] md:max-w-none">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-pink-500">Staff</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-pink-500 transition-colors"
                  title="Log out"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
        {/* Mobile-optimized Profile Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-pink-500 mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-pink-200 bg-pink-500">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </h2>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="flex justify-center mb-4 md:mb-0 md:mr-8">
                <div className="relative">
                  {session.user.image ? (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-pink-500">
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-pink-500">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-400">
                        {session.user.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full border-2 border-white">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-left md:flex-grow w-full">
                <h3 className="text-xl font-bold text-gray-800">{session.user.name}</h3>
                <p className="text-pink-500 mb-4 text-sm truncate">{session.user.email}</p>
                
                <div className="border-t border-pink-100 pt-4 md:pt-6">
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">Staff Profile</h4>
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button 
                            onClick={saveProfile}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-150"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditing(false);
                              setEditedProfile(profileData);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-150"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-150 ease-in-out shadow-sm hover:shadow-md"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                 
                  </div>
                  
                  {isEditing ? (
                    // Edit mode - form inputs, mobile-optimized
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">College/University</label>
                        <input
                          type="text"
                          name="college"
                          value={editedProfile.college}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={editedProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={editedProfile.address}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Shoe Size</label>
                        <input
                          type="text"
                          name="shoeSize"
                          value={editedProfile.shoeSize}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 font-medium mb-1">Dress/Suit Size</label>
                        <input
                          type="text"
                          name="dressSize"
                          value={editedProfile.dressSize}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    // View mode - mobile-optimized display
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-pink-600 font-medium">College/University</p>
                        <p className="font-medium text-gray-800">{profileData.college || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-pink-600 font-medium">Phone</p>
                        <p className="font-medium text-gray-800">{profileData.phone || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-pink-600 font-medium">Address</p>
                        <p className="font-medium text-gray-800">{profileData.address || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-pink-600 font-medium">Shoe Size</p>
                        <p className="font-medium text-gray-800">{profileData.shoeSize || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-pink-600 font-medium">Dress/Suit Size</p>
                        <p className="font-medium text-gray-800">{profileData.dressSize || 'Not specified'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calendar and Availability - One Column on Mobile, Two on Larger Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-pink-500 max-h-[450px] sm:max-h-[550px] overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-pink-200 bg-pink-500 sticky top-0 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </h2>
            </div>
            <div className="p-3 sm:p-4">
              <AvailabilityCalendar staffDocRef={staffDocRef} />
            </div>
            
            {/* Current Bookings/Availability Summary */}
            <div className="mt-3 sm:mt-4 border-t-2 border-pink-200 pt-3 sm:pt-4">
              <h3 className="text-base sm:text-lg font-semibold text-pink-600 mb-2 sm:mb-3 px-3 sm:px-4">Bookings</h3>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <BookingSummary staffDocRef={staffDocRef} staffEmail={session.user.email} staffName={session.user.name} />
              </div>
            </div>
          </div>
          
          {/* Availability Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-pink-500 max-h-[450px] sm:max-h-[550px] overflow-y-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-pink-200 bg-pink-500 sticky top-0 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Manage Availability
              </h2>
            </div>
            <div className="p-3 sm:p-4">
              <ShowAvailability session={session} staffDocRef={staffDocRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 