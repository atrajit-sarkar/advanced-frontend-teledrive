'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, Phone, KeyRound, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsLoading(true); setError(null);
    try {
      const { sendCode } = await import('@/lib/backend');
      await sendCode(phoneNumber.trim());
      setStep('code');
    } catch (err:any) {
      setError(err.message || 'Failed to send code');
    } finally { setIsLoading(false); }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true); setError(null);
    try {
      const { checkCode, fetchMe } = await import('@/lib/backend');
      const status = await checkCode(code.trim());
      if (status === 'authorized') {
        const me = await fetchMe();
        if (me.authorized) router.push('/dashboard'); else setError('Not authorized');
      } else if (status === 'password_required') {
        setStep('password');
      } else {
        setError('Unknown status');
      }
    } catch (err:any) {
      setError(err.message || 'Verification failed');
    } finally { setIsLoading(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoading(true); setError(null);
    try {
      const { checkPassword, fetchMe } = await import('@/lib/backend');
      const ok = await checkPassword(password.trim());
      if (ok) {
        const me = await fetchMe();
        if (me.authorized) router.push('/dashboard'); else setError('Not authorized');
      } else setError('Password incorrect');
    } catch (err:any) { setError(err.message || 'Password check failed'); }
    finally { setIsLoading(false); }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center p-8 bg-card/50">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline">Welcome to TeleDrive</CardTitle>
          <CardDescription>Your personal cloud, powered by Telegram.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Sign in</h3>
                <p className="text-sm text-muted-foreground">Enter your phone number to receive a login code in your Telegram app.</p>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +1 234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="pl-10 h-12 text-lg"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? 'Sending Code...' : 'Send Code'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Enter Code</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a login code to your <strong>Saved Messages</strong> in Telegram.
                </p>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  placeholder="Login Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="pl-10 h-12 text-lg tracking-widest"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? 'Verifying...' : 'Verify Code'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              <Button variant="link" onClick={() => setStep('phone')} className="w-full">
                Back to phone number
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Two Factor Password</h3>
                <p className="text-sm text-muted-foreground">Enter your Telegram cloud password.</p>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 text-lg"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? 'Verifying...' : 'Log In'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
              <Button variant="link" onClick={() => setStep('code')} className="w-full">
                Back to code
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="p-4 bg-muted/50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-xs text-muted-foreground mx-auto">
                <Bot className="mr-2 h-4 w-4" />
                Required: Telegram API Setup Guide
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-headline">Telegram Bot API Setup</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <div>To make TeleDrive fully functional, you need to set up a Telegram Bot and obtain API credentials.</div>
                    <ol className="list-decimal list-inside text-sm text-left space-y-1">
                      <li>Talk to <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a> on Telegram to create a new bot.</li>
                      <li>You will receive an API token. Store it securely.</li>
                      <li>This token will be used in your application's backend to interact with the Telegram API for uploading and fetching files.</li>
                      <li>The authentication flow will also use this API to send login codes.</li>
                    </ol>
                    <div className="font-semibold">This is a mock interface. The actual backend logic needs to be implemented by you.</div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </main>
  );
}
