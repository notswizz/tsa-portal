import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Availability() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityData, setAvailabilityData] = useState({
    workingHours: {
      monday: { isWorking: true, start: '09:00', end: '17:00' },
      tuesday: { isWorking: true, start: '09:00', end: '17:00' },
      wednesday: { isWorking: true, start: '09:00', end: '17:00' },
      thursday: { isWorking: true, start: '09:00', end: '17:00' },
      friday: { isWorking: true, start: '09:00', end: '17:00' },
      saturday: { isWorking: false, start: '10:00', end: '14:00' },
      sunday: { isWorking: false, start: '10:00', end: '14:00' },
    },
    unavailableDates: [],
    newUnavailableDate: '',
  });

  useEffect(() => {
    // Protect route - redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/staff');
    }

    // Set loading to false when session is available
    if (status !== 'loading') {
      // Simulate loading of availability data
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [session, status, router]);

  const handleWorkingDayToggle = (day) => {
    setAvailabilityData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          isWorking: !prev.workingHours[day].isWorking,
        },
      },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setAvailabilityData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [type]: value,
        },
      },
    }));
  };

  const handleAddUnavailableDate = () => {
    if (!availabilityData.newUnavailableDate) return;
    
    const newDate = availabilityData.newUnavailableDate;
    
    // Check if date already exists
    if (availabilityData.unavailableDates.includes(newDate)) {
      return;
    }
    
    setAvailabilityData(prev => ({
      ...prev,
      unavailableDates: [...prev.unavailableDates, newDate].sort(),
      newUnavailableDate: '',
    }));
  };

  const handleRemoveUnavailableDate = (date) => {
    setAvailabilityData(prev => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter(d => d !== date),
    }));
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    
    try {
      // In a real app, you'd save to a backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success message would be shown
    } catch (error) {
      console.error('Error saving availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-base sm:text-lg text-gray-600">Loading your availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Manage Availability</h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
          Set your working hours and mark days when you're unavailable.
        </p>
      </div>

      <div className="space-y-6 sm:space-y-10">
        {/* Working Hours Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-base sm:text-lg leading-6 font-medium text-gray-900">Working Hours</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Set your regular weekly schedule.</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 px-4 py-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-200 last:border-0">
                    <div className="flex items-center">
                      <input
                        id={`working-${day.id}`}
                        type="checkbox"
                        checked={availabilityData.workingHours[day.id].isWorking}
                        onChange={() => handleWorkingDayToggle(day.id)}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor={`working-${day.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {day.label}
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <label htmlFor={`start-${day.id}`} className="sr-only">Start time</label>
                        <input
                          id={`start-${day.id}`}
                          type="time"
                          value={availabilityData.workingHours[day.id].start}
                          onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                          disabled={!availabilityData.workingHours[day.id].isWorking}
                          className="block w-24 sm:w-28 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:opacity-50 text-sm sm:text-base"
                        />
                      </div>
                      <span className="text-gray-500 text-sm">to</span>
                      <div className="flex items-center">
                        <label htmlFor={`end-${day.id}`} className="sr-only">End time</label>
                        <input
                          id={`end-${day.id}`}
                          type="time"
                          value={availabilityData.workingHours[day.id].end}
                          onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                          disabled={!availabilityData.workingHours[day.id].isWorking}
                          className="block w-24 sm:w-28 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:opacity-50 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unavailable Dates Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-base sm:text-lg leading-6 font-medium text-gray-900">Unavailable Dates</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Mark specific days when you're not available.</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 px-4 py-4 sm:p-6">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-grow">
                  <label htmlFor="new-unavailable-date" className="sr-only">Add unavailable date</label>
                  <input
                    type="date"
                    id="new-unavailable-date"
                    value={availabilityData.newUnavailableDate}
                    onChange={(e) => setAvailabilityData(prev => ({ ...prev, newUnavailableDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddUnavailableDate}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Add Date
                </button>
              </div>

              <div className="mt-4 sm:mt-6">
                {availabilityData.unavailableDates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-3 sm:py-4">No unavailable dates set.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 max-h-48 sm:max-h-60 overflow-y-auto rounded-md border border-gray-200">
                    {availabilityData.unavailableDates.map((date) => (
                      <li key={date} className="py-2 sm:py-3 px-3 flex justify-between items-center hover:bg-gray-50">
                        <span className="text-sm font-medium text-gray-900 truncate pr-2">
                          {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUnavailableDate(date)}
                          className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveAvailability}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Availability'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 