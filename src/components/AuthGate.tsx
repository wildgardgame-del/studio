'use client';

import { useUser } from "@/firebase";
import { WelcomeForm } from "./WelcomeForm";
import { Loader2 } from "lucide-react";

type AuthGateProps = {
  children: React.ReactNode;
};

/**
 * AuthGate component ensures that new users complete their profile
 * before accessing the main application.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isUserLoading, isNewUser, user } = useUser();

  // While checking user status, show a loader.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is authenticated and is a new user, show the WelcomeForm.
  if (user && isNewUser) {
    return <WelcomeForm />;
  }

  // Otherwise, render the main application.
  return <>{children}</>;
}
