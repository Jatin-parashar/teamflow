import { Loader2 } from "lucide-react";

const LoaderIcon = () => {
  return (
    <div className="flex items-center justify-center p-4 h-20 md:h-96">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );
};

export default LoaderIcon;
