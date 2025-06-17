import { Link } from "react-router-dom";

export default function Notfound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-6xl font-bold">404</div>
        <h1 className="text-3xl font-bold ">Page Not Found</h1>
        <p className="text-lg">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sidebar-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}