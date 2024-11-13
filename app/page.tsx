import { LoginForm } from '@/components/login-form';
import { ModeToggle } from '@/components/mode-toggle';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}