import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

export default function ShowAvailability({ session, staffDocRef }) {
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [showDates, setShowDates] = useState([]);

  // Fetch all shows from Firestore
  useEffect(() => {
    async function fetchShows() {
      try {
        setLoading(true);
        const showsCollection = collection(db, 'shows');
        const showSnapshot = await getDocs(showsCollection);
        const showsList = showSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setShows(showsList);
      } catch (error) {
        console.error("Error fetching shows:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchShows();
    }
  }, [session]);

  // Fetch staff availability for selected show
  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedShow || !session?.user?.email) return;
      
      try {
        setLoading(true);
        
        // Query the availability collection for this staff and show
        const availabilityCollection = collection(db, 'availability');
        const availabilityQuery = query(
          availabilityCollection, 
          where('staffId', '==', staffDocRef.id),
          where('showId', '==', selectedShow.id)
        );
        
        const availabilitySnapshot = await getDocs(availabilityQuery);
        
        // Get all available dates for this show
        const availableDateList = [];
        
        availabilitySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.availableDates && Array.isArray(data.availableDates)) {
            availableDateList.push(...data.availableDates);
          }
        });
        
        setAvailableDates(availableDateList);
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [selectedShow, session, staffDocRef]);

  // Generate dates between startDate and endDate
  useEffect(() => {
    if (selectedShow) {
      const start = parseISO(selectedShow.startDate);
      const end = parseISO(selectedShow.endDate);
      const dayCount = differenceInCalendarDays(end, start) + 1;
      
      const dates = [];
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }
      
      setShowDates(dates);
    }
  }, [selectedShow]);

  const handleShowSelect = (showId) => {
    const show = shows.find(s => s.id === showId);
    setSelectedShow(show || null);
  };

  const handleDateToggle = (date) => {
    if (!selectedShow) return;
    
    setAvailableDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };

  const saveAvailability = async () => {
    if (!staffDocRef || !selectedShow || !session?.user?.email) return;
    
    try {
      setSavingAvailability(true);
      
      // Query existing availability document for this staff and show
      const availabilityCollection = collection(db, 'availability');
      const availabilityQuery = query(
        availabilityCollection, 
        where('staffId', '==', staffDocRef.id),
        where('showId', '==', selectedShow.id)
      );
      
      const availabilitySnapshot = await getDocs(availabilityQuery);
      
      // Update or create the availability document
      if (!availabilitySnapshot.empty) {
        // Update existing document
        const availabilityDoc = availabilitySnapshot.docs[0];
        await updateDoc(doc(db, 'availability', availabilityDoc.id), {
          availableDates,
          updatedAt: new Date(),
        });
      } else {
        // Create new document
        await addDoc(collection(db, 'availability'), {
          staffId: staffDocRef.id,
          staffName: session.user.name,
          showId: selectedShow.id,
          availableDates,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      alert("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability. Please try again.");
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-xl overflow-hidden border-2 border-pink-500">
      
        <div className="border-t border-pink-100">
          <div className="px-4 py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden border-2 border-pink-500">
    
      
      <div className="border-t border-pink-100">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {shows.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-700">No upcoming shows found</p>
              <p className="mt-1 sm:mt-2 text-sm text-gray-500">Check back later for new show listings</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="show-select" className="block text-sm font-medium text-gray-700">Select a Show</label>
                <div className="mt-1.5 sm:mt-2 relative rounded-md shadow-sm">
                  <select
                    id="show-select"
                    className="block w-full pl-3 pr-10 py-2.5 sm:py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-lg transition-all"
                    value={selectedShow?.id || ""}
                    onChange={(e) => handleShowSelect(e.target.value)}
                  >
                    <option value="">-- Select a show --</option>
                    {shows.map((show) => (
                      <option key={show.id} value={show.id}>
                        {show.name} ({format(parseISO(show.startDate), 'MMM d')} - {format(parseISO(show.endDate), 'MMM d, yyyy')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedShow && (
                <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-3 sm:p-5 shadow-inner">
                  <div className="mb-3 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-800">{selectedShow.name}</h4>
                      <div className="text-xs sm:text-sm bg-pink-50 text-pink-600 px-2 sm:px-3 py-1 rounded-full font-medium">
                        {selectedShow.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-5 mb-4 sm:mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">Please check the dates you're available:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                      {showDates.map((date) => {
                        const isAvailable = availableDates.includes(date);
                        return (
                          <div 
                            key={date} 
                            className={`flex items-center p-2 sm:p-2.5 rounded-lg cursor-pointer transition-all touch-manipulation ${
                              isAvailable 
                                ? 'bg-pink-50 border border-pink-200' 
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleDateToggle(date)}
                          >
                            <div className="flex items-center w-full">
                              <input
                                id={`date-${date}`}
                                name={`date-${date}`}
                                type="checkbox"
                                checked={isAvailable}
                                onChange={() => {}}
                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`date-${date}`} className="ml-3 block text-sm text-gray-800 cursor-pointer truncate w-full">
                                {format(parseISO(date), 'EEE, MMM d, yyyy')}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 sm:mt-6">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all duration-150"
                      onClick={saveAvailability}
                      disabled={savingAvailability}
                    >
                      {savingAvailability ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Availability'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 