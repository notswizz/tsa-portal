import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isHoveredClient, setIsHoveredClient] = useState(false);
  const [isHoveredStaff, setIsHoveredStaff] = useState(false);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="block">Welcome to</span>
            <span className="block text-primary">The Smith Agency</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
           Boutique Staffing
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
            <Link 
              href="/client"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-1"
              onMouseEnter={() => setIsHoveredClient(true)}
              onMouseLeave={() => setIsHoveredClient(false)}
            >
              Client Portal
            </Link>
            <Link 
              href="/staff"
              className="inline-flex items-center justify-center px-8 py-4 border border-white text-lg font-medium rounded-md shadow-lg text-white bg-transparent hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 transform hover:-translate-y-1"
              onMouseEnter={() => setIsHoveredStaff(true)}
              onMouseLeave={() => setIsHoveredStaff(false)}
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
