import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import BrandMark from '@/components/BrandMark';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <BrandMark size="md" />
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <h1 className="text-4xl font-bold">404</h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link href="/">
          <Button 
            className="w-full bg-gradient-to-r from-primary to-brand-magenta hover:opacity-90 transition-opacity"
            size="lg"
            data-testid="button-back-home"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Arena
          </Button>
        </Link>
      </div>
    </main>
  );
}
