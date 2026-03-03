import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors" 
              data-testid="link-terms"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors" 
              data-testid="link-privacy"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pally Feud. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
