import { ArrowLeft } from "lucide-react";
import NotFoundImg from "../../assets/404.avif";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <img
            src={NotFoundImg}
            alt="404 Error"
            className="mx-auto h-48 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => (window.location.href = "/")}
          variant="secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
