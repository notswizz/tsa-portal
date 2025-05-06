import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';

export default function AvailabilitySummary({ staffDocRef }) {
  const [upcomingAvailability, setUpcomingAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});

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
        
        // Create structured upcoming availability data
        const today = new Date();
        const formattedToday = format(today, 'yyyy-MM-dd');
        
        const upcomingData = showsList
          .filter(show => {
            // Filter to only include upcoming shows
            const endDate = parseISO(show.endDate);
            return !isBefore(endDate, today);
          })
          .map(show => {
            const availableDates = availMap[show.id] || [];
            
            // Filter to only upcoming dates
            const upcomingDates = availableDates
              .filter(dateStr => {
                const date = parseISO(dateStr);
                return !isBefore(date, today) || format(date, 'yyyy-MM-dd') === formattedToday;
              })
              .sort();
            
            return {
              show,
              dates: upcomingDates
            };
          })
          .filter(item => item.dates.length > 0) // Only include shows with upcoming available dates
          .sort((a, b) => {
            // Sort by the earliest available date
            if (a.dates.length === 0) return 1;
            if (b.dates.length === 0) return -1;
            
            const aDate = parseISO(a.dates[0]);
            const bDate = parseISO(b.dates[0]);
            return aDate - bDate;
          });
        
        setUpcomingAvailability(upcomingData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [staffDocRef]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (upcomingAvailability.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No upcoming availability set.</p>
        <p className="text-sm mt-2">Select dates in the Manage Availability section to set your availability.</p>
      </div>
    );
  }

  // Group dates that are consecutive into ranges
  const formatDateRanges = (dates) => {
    if (!dates || dates.length === 0) return [];
    
    const ranges = [];
    let rangeStart = parseISO(dates[0]);
    let rangeEnd = rangeStart;
    
    for (let i = 1; i < dates.length; i++) {
      const currentDate = parseISO(dates[i]);
      const expectedDate = addDays(rangeEnd, 1);
      
      if (format(currentDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        // Consecutive date, extend the range
        rangeEnd = currentDate;
      } else {
        // Non-consecutive, end the current range and start a new one
        ranges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = currentDate;
        rangeEnd = currentDate;
      }
    }
    
    // Add the last range
    ranges.push({ start: rangeStart, end: rangeEnd });
    
    return ranges;
  };

  return (
    <div className="space-y-4">
      {upcomingAvailability.map((item) => {
        const dateRanges = formatDateRanges(item.dates);
        const show = item.show;
        
        return (
          <div key={show.id} className="border border-pink-100 rounded-lg p-3 bg-pink-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{show.name}</h4>
                <p className="text-sm text-gray-600">{show.location}</p>
              </div>
              <div className="bg-pink-100 text-xs text-pink-800 px-2 py-1 rounded">
                {format(parseISO(show.startDate), 'MMM d')} - {format(parseISO(show.endDate), 'MMM d, yyyy')}
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Available on:</p>
              <div className="flex flex-wrap gap-1">
                {dateRanges.map((range, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-white border border-pink-200 text-gray-700 px-2 py-1 rounded"
                  >
                    {format(range.start, 'MMM d')}
                    {format(range.start, 'yyyy-MM-dd') !== format(range.end, 'yyyy-MM-dd') && 
                      ` - ${format(range.end, 'MMM d')}`
                    }
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 