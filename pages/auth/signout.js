import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

export default function SignOut() {
  useEffect(() => {
    // Sign out and redirect to home
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-bold">Signing out...</h2>
        <p className="mt-2 text-gray-600">You are being signed out. Redirecting to home page...</p>
      </div>
    </div>
  );
} 