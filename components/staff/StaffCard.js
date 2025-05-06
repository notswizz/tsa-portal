import React from 'react';

export default function StaffCard({ title, description, icon, href, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1 transform">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900 truncate">{title}</h3>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          {href ? (
            <a href={href} className="font-medium text-primary hover:text-primary-dark">
              Access &rarr;
            </a>
          ) : (
            <button 
              onClick={handleClick}
              className="font-medium text-primary hover:text-primary-dark"
            >
              Access &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 