import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!session_id) return;

    // You could verify the session with your backend here
    // For now we'll just simulate a successful payment
    const timer = setTimeout(() => {
      setStatus('success');
    }, 1500);

    return () => clearTimeout(timer);
  }, [session_id]);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Confirming your payment...</h1>
          <p className="mt-2 text-lg text-gray-500">Please wait while we verify your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Payment successful!</h1>
        <p className="mt-2 text-lg text-gray-500">
          Thank you for your payment. We have received your request and will be in touch soon.
        </p>
        <div className="mt-10">
          <p className="text-sm font-medium text-gray-500">Payment ID</p>
          <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-100 p-2 rounded">{session_id}</p>
        </div>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 