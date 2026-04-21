import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow p-6 text-center max-w-md w-full">
        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Something went wrong.
        </h1>
        <p className="text-gray-600 mb-4 text-sm">
          We encountered an error. Please try again later.
        </p>

        <Button
          onClick={() => navigate("/")}
          className="w-full cursor-pointer sm:w-auto hover:bg-neutral-300 hover:text-neutral-800 transition-colors delay-100 ease-in-out"
          variant="secondary"
        >
          Go Home
        </Button>
      </div>
    </main>
  );
};

export default ErrorPage;
