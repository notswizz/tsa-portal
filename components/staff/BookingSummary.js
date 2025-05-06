import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, parseISO, isBefore, isAfter, addDays } from 'date-fns';

export default function BookingSummary({ staffDocRef, staffEmail, staffName }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!staffDocRef) return;
      
      try {
        setLoading(true);
        
        // Fetch clients for reference
        const clientsCollection = collection(db, 'clients');
        const clientsSnapshot = await getDocs(clientsCollection);
        const clientsMap = {};
        clientsSnapshot.docs.forEach(doc => {
          clientsMap[doc.id] = doc.data().name || 'Unknown Client';
        });

        // Fetch shows for reference
        const showsCollection = collection(db, 'shows');
        const showsSnapshot = await getDocs(showsCollection);
        const showsMap = {};
        showsSnapshot.docs.forEach(doc => {
          showsMap[doc.id] = {
            ...doc.data(),
            id: doc.id
          };
        });
        
        // Fetch bookings collection
        const bookingsCollection = collection(db, 'bookings');
        const bookingsSnapshot = await getDocs(bookingsCollection);
        
        const staffBookings = [];
        
        bookingsSnapshot.docs.forEach(doc => {
          const booking = doc.data();
          
          // Check if this booking has datesNeeded with staffIds that match this staff
          if (booking.datesNeeded && Array.isArray(booking.datesNeeded)) {
            booking.datesNeeded.forEach((dateNeeded, dateIndex) => {
              if (dateNeeded.staffIds && Array.isArray(dateNeeded.staffIds)) {
                // Check if staff is in staffIds array
                const isStaffBooked = dateNeeded.staffIds.some(id => 
                  id === staffDocRef.id || 
                  id === staffEmail || 
                  id === staffName
                );
                
                if (isStaffBooked) {
                  const showData = showsMap[booking.showId] || {};
                  
                  // Determine the best show name to use
                  let showName = showData.name;
                  if (!showName && booking.showName) {
                    showName = booking.showName;
                  }
                  if (!showName && booking.title) {
                    showName = booking.title;
                  }
                  if (!showName && booking.name) {
                    showName = booking.name;
                  }
                  if (!showName) {
                    showName = 'Unknown Show';
                  }
                  
                  staffBookings.push({
                    id: doc.id,
                    date: dateNeeded.date,
                    clientId: booking.clientId,
                    clientName: clientsMap[booking.clientId] || 'Unknown Client',
                    showId: booking.showId,
                    showName: showName,
                    location: booking.location || showData.location || '',
                    notes: booking.notes || '',
                    dateIndex,
                    booking
                  });
                }
              }
            });
          }
        });
        
        // Sort by date (soonest first)
        staffBookings.sort((a, b) => {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateA - dateB;
        });
        
        setBookings(staffBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [staffDocRef, staffEmail, staffName]);

  if (loading) {
    return (
      <div className="flex justify-center py-3 sm:py-4">
        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-3 sm:py-4 text-gray-500">
        <p>No upcoming bookings found.</p>
        <p className="text-xs sm:text-sm mt-1 sm:mt-2">You'll see your scheduled bookings here when you're assigned to events.</p>
      </div>
    );
  }

  // Group bookings by show/client for better organization
  const groupBookingsByShow = (bookingsList) => {
    const grouped = {};
    
    bookingsList.forEach(booking => {
      // Create a unique key combining showId and clientId
      const key = `${booking.showId || 'unknown'}-${booking.clientId || 'unknown'}`;
      
      // Try to get the title from various sources
      let title = booking.showName;
      if (!title && booking.booking && booking.booking.title) {
        title = booking.booking.title;
      }
      if (!title && booking.booking && booking.booking.name) {
        title = booking.booking.name;
      }
      if (!title) {
        title = 'Show';
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          title,
          clientName: booking.clientName,
          location: booking.location,
          id: booking.showId,
          clientId: booking.clientId,
          dates: []
        };
      }
      
      grouped[key].dates.push({
        date: booking.date,
        bookingId: booking.id,
        notes: booking.notes
      });
    });
    
    // Sort dates within each group
    Object.values(grouped).forEach(group => {
      group.dates.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA - dateB;
      });
      
      // Add first and last date for display
      if (group.dates.length > 0) {
        group.firstDate = parseISO(group.dates[0].date);
        group.lastDate = parseISO(group.dates[group.dates.length - 1].date);
      }
    });
    
    return Object.values(grouped).sort((a, b) => {
      // Sort by first date
      return a.firstDate - b.firstDate;
    });
  };

  const groupedBookings = groupBookingsByShow(bookings);

  // Format date ranges nicely
  const formatDateRange = (dates) => {
    if (!dates || dates.length === 0) return 'No dates';
    
    if (dates.length === 1) {
      return format(parseISO(dates[0].date), 'EEE, MMM d, yyyy');
    }
    
    // Find consecutive date ranges
    const ranges = [];
    let currentRange = [parseISO(dates[0].date)];
    
    for (let i = 1; i < dates.length; i++) {
      const currentDate = parseISO(dates[i].date);
      const previousDate = parseISO(dates[i-1].date);
      const expectedDate = addDays(previousDate, 1);
      
      if (format(currentDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        // Add to current range
        currentRange.push(currentDate);
      } else {
        // Start new range
        ranges.push([...currentRange]);
        currentRange = [currentDate];
      }
    }
    
    // Add the last range
    if (currentRange.length > 0) {
      ranges.push([...currentRange]);
    }
    
    // Format each range
    return ranges.map(range => {
      if (range.length === 1) {
        return format(range[0], 'MMM d');
      }
      return `${format(range[0], 'MMM d')} - ${format(range[range.length - 1], 'MMM d')}`;
    }).join(', ');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {groupedBookings.map((booking, index) => (
        <div key={`${booking.id}-${booking.clientId}-${index}`} className="border border-pink-100 rounded-lg p-2.5 sm:p-3 bg-pink-50">
          <div className="flex justify-between items-start flex-wrap gap-1 sm:flex-nowrap">
            <div className="pr-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">{booking.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Client: {booking.clientName}</p>
            </div>
            <div className="bg-pink-100 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap text-pink-800">
              {booking.dates.length} {booking.dates.length === 1 ? 'day' : 'days'}
            </div>
          </div>
          
          <div className="mt-2 sm:mt-3">
            <p className="text-xs sm:text-sm text-gray-700 ml-0 sm:ml-5">
              {formatDateRange(booking.dates)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 