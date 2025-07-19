
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Chrome, TriangleAlert } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

function SignupPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  useEffect(() => {
    setIsFirebaseConfigured(!!auth);
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setError(null);
    if (password.length < 6) {
      setError(t('signup.password_too_short'));
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });

      await setDoc(doc(db, "users", user.uid), {
        displayName: username,
        email: user.email,
        photoURL: user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        bio: '',
        location: '',
        theme: 'dark',
        language: 'en'
      });
      
      toast({
        title: t('signup.success_title'),
        description: t('signup.success_description'),
      });
      router.push('/profile');
    } catch (err: any) {
      setError(t(`firebase_errors.${err.code}` as any) || t('signup.generic_error'));
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
          // Existing user, just update last login
          await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      } else {
          // New user, create the full document
          await setDoc(userDocRef, {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`,
              role: 'user',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              bio: '',
              location: '',
              theme: 'dark',
              language: 'en'
          });
      }

      toast({
        title: t('login.success_title'),
        description: t('login.success_description'),
      });
      router.push('/profile');
    } catch (err: any) {
       setError(t(`firebase_errors.${err.code}` as any) || t('login.generic_error'));
    }
  };

  return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('signup.title')}</CardTitle>
          <CardDescription>
            {t('signup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>{t('signup.error_title')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
           {!isFirebaseConfigured && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Firebase Not Configured</AlertTitle>
              <AlertDescription>
                Please configure your Firebase environment variables in `.env.local` to enable authentication.
              </AlertDescription>
            </Alert>
          )}
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={!isFirebaseConfigured}>
            <Chrome className="mr-2 h-4 w-4" />
            {t('login.google_signin')}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t('login.or_continue_with')}
              </span>
            </div>
          </div>
          <form onSubmit={handleEmailSignup} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="username">{t('profile.username_label')}</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder={t('profile.username_value')}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isFirebaseConfigured}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('login.email_label')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isFirebaseConfigured}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('login.password_label')}</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isFirebaseConfigured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!isFirebaseConfigured}>{t('signup.signup_button')}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t('signup.have_account')}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t('signup.login_link')}
            </Link>
          </p>
        </CardFooter>
      </Card>
  );
}

export default function SignupPage() {
    return <SignupPageContent />
}
