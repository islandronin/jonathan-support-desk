import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="max-w-md w-full text-center px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          JonathanSupport
        </h1>
        <p className="text-gray-500 mb-8">
          Get help with your products. Submit a ticket and we&apos;ll get back
          to you quickly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
