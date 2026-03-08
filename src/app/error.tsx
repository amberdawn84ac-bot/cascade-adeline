'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Root error boundary caught:', error);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
        <p className="text-gray-600">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
