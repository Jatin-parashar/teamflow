import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField = ({
  id,
  label,
  required,
  error,
  children,
}: FormFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
    {children}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        {error}
      </p>
    )}
  </div>
);

export default FormField;
