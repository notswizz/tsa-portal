import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

export default function AvailabilityCalendar({ staffDocRef }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});

  // Fetch all shows and staff availability from Firestore
  useEffect(() => {
    async function fetchData() {
      if (!staffDocRef) return;
      
      try {
        setLoading(true);
        
        // Fetch shows
        const showsCollection = collection(db, 'shows');
        const showSnapshot = await getDocs(showsCollection);
        const showsList = showSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setShows(showsList);
        
        // Fetch availability for this staff member
        const availabilityCollection = collection(db, 'availability');
        const availabilityQuery = query(
          availabilityCollection,
          where('staffId', '==', staffDocRef.id)
        );
        
        const availabilitySnapshot = await getDocs(availabilityQuery);
        
        // Build map of show ID -> dates
        const availMap = {};
        
        availabilitySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.showId && data.availableDates && Array.isArray(data.availableDates)) {
            availMap[data.showId] = data.availableDates;
          }
        });
        
        setAvailabilityMap(availMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [staffDocRef]);

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    setCalendarDays(daysInMonth);
  }, [currentDate]);

  // Get the previous month
  const previousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  // Get the next month
  const nextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  // Get all show dates for a specific day
  const getShowsForDate = (date) => {
    return shows.filter(show => {
      // Check if this show has dates that include this calendar day
      const startDate = parseISO(show.startDate);
      const endDate = parseISO(show.endDate);
      
      const currentDateStr = format(date, 'yyyy-MM-dd');
      return (
        currentDateStr >= format(startDate, 'yyyy-MM-dd') && 
        currentDateStr <= format(endDate, 'yyyy-MM-dd')
      );
    });
  };

  // Check if a user is available for a specific show on a specific date
  const isAvailableForShow = (showId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilityMap[showId]?.includes(dateStr) || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-2 sm:p-4 rounded-xl shadow-xl">
      <div className="bg-black bg-opacity-40 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <button
            onClick={previousMonth}
            className="p-1.5 sm:p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-all shadow-md"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base sm:text-xl font-bold text-pink-500">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-all shadow-md"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-px sm:gap-1 rounded-lg overflow-hidden border border-pink-500 shadow-lg">
          {/* Calendar day headers - shortened for mobile */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={day + index} className="bg-pink-500 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-white">
              <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
          
          {/* Empty cells for the start of the month */}
          {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, index) => (
            <div key={`empty-start-${index}`} className="bg-gray-900 h-14 sm:h-18 p-0.5 sm:p-1"></div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day) => {
            const showsOnDay = getShowsForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()} 
                className={`relative bg-gray-900 border-b border-r border-pink-500 border-opacity-20 h-14 sm:h-18 p-0.5 sm:p-1 hover:bg-black transition-all ${
                  isToday ? 'ring-1 sm:ring-2 ring-pink-500' : ''
                }`}
              >
                <div className={`font-medium text-xs sm:text-sm ${isToday ? 'text-pink-500 font-bold' : 'text-pink-200'}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-9 sm:max-h-12">
                  {showsOnDay.length > 0 && (
                    <>
                      {/* Mobile view: Just show dots for shows */}
                      <div className="flex space-x-1 sm:hidden mt-1">
                        {showsOnDay.slice(0, 3).map((show) => {
                          const isAvailable = isAvailableForShow(show.id, day);
                          return (
                            <div 
                              key={show.id} 
                              className={`h-2 w-2 rounded-full ${
                                isAvailable ? 'bg-pink-500' : 'bg-gray-600'
                              }`}
                              title={`${show.name} - ${isAvailable ? 'Available' : 'Not Available'}`}
                            ></div>
                          );
                        })}
                        {showsOnDay.length > 3 && (
                          <div className="text-xs text-gray-400">+{showsOnDay.length - 3}</div>
                        )}
                      </div>
                      
                      {/* Desktop view: Show names */}
                      <div className="hidden sm:block">
                        {showsOnDay.map((show) => {
                          const isAvailable = isAvailableForShow(show.id, day);
                          
                          return (
                            <div 
                              key={show.id} 
                              className={`text-xs p-1 rounded truncate ${
                                isAvailable 
                                  ? 'bg-pink-500 text-white' 
                                  : 'bg-gray-800 text-gray-400'
                              }`}
                              title={`${show.name} - ${isAvailable ? 'Available' : 'Not Available'}`}
                            >
                              {show.name}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Empty cells for the end of the month */}
          {Array.from({ length: 6 - (calendarDays[calendarDays.length - 1]?.getDay() || 0) }).map((_, index) => (
            <div key={`empty-end-${index}`} className="bg-gray-900 h-14 sm:h-18 p-0.5 sm:p-1"></div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-2 sm:mt-3 flex items-center justify-center space-x-4 sm:space-x-6 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-pink-500 mr-1 sm:mr-2 shadow-sm"></div>
            <span className="text-pink-300">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-800 mr-1 sm:mr-2 shadow-sm"></div>
            <span className="text-gray-400">Not Available</span>
          </div>
        </div>
      </div>
    </div>
  );
} 