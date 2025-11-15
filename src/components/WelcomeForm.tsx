
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isBefore, subYears } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { setDoc, doc, serverTimestamp, getDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const months = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));


const formSchema = z.object({
  username: z.string().min(3, "Nickname must be at least 3 characters.").max(19, "Nickname can be at most 19 characters."),
  email: z.string().optional(),
  day: z.string().min(1, "Day is required."),
  month: z.string().min(1, "Month is required."),
  year: z.string().min(1, "Year is required."),
}).refine(data => {
  if (!data.year || !data.month || !data.day) return true; 
  const date = new Date(`${data.year}-${data.month}-${data.day}`);
  return date.getDate() === parseInt(data.day);
}, {
  message: "Invalid date. Please select a valid day for the chosen month.",
  path: ["day"],
});

export function WelcomeForm() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zod schema that is conditional based on the user object
  const conditionalFormSchema = formSchema.superRefine((data, ctx) => {
    if (!user?.email && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A valid email is required for wallet users.",
        path: ["email"],
      });
    }
  });
  
  const form = useForm<z.infer<typeof conditionalFormSchema>>({
    resolver: zodResolver(conditionalFormSchema),
    defaultValues: {
      username: "",
      email: "",
      day: "",
      month: "",
      year: "",
    },
  });

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    if (!firestore) return false;
    const usernameRef = doc(firestore, "usernames", username.toLowerCase());
    
    try {
        const docSnap = await getDoc(usernameRef);
        return docSnap.exists();
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: usernameRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
  };

  async function onSubmit(values: z.infer<typeof conditionalFormSchema>) {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    try {
        const usernameExists = await checkUsernameExists(values.username);
        if (usernameExists) {
            form.setError("username", { type: "manual", message: "This nickname is already taken. Please choose another." });
            setIsSubmitting(false);
            return;
        }

        const dateOfBirth = new Date(`${values.year}-${values.month}-${values.day}`);
        const eighteenYearsAgo = subYears(new Date(), 18);
        const isAgeVerified = isBefore(dateOfBirth, eighteenYearsAgo);
        
        const batch = writeBatch(firestore);
        
        // 1. Create user profile document
        const userRef = doc(firestore, "users", user.uid);
        const userData = {
            id: user.uid,
            username: values.username,
            // Use provided email for wallet users, or existing email for others
            email: user.email || values.email, 
            registrationDate: serverTimestamp(),
            dateOfBirth: dateOfBirth.toISOString().split('T')[0],
            isAgeVerified,
        };
        batch.set(userRef, userData);
        
        // 2. Create username uniqueness document
        const usernameRef = doc(firestore, "usernames", values.username.toLowerCase());
        const usernameData = {
            userId: user.uid,
            username: values.username
        };
        batch.set(usernameRef, usernameData);

        // Non-blocking write with contextual error handling
        batch.commit()
            .then(() => {
                toast({
                    title: "Profile Complete!",
                    description: "Welcome to GameSphere!",
                });
                window.location.reload();
            })
            .catch((serverError) => {
                // This will catch errors from either write operation in the batch
                const permissionError = new FirestorePermissionError({
                    path: `users/${user.uid} or usernames/${values.username.toLowerCase()}`,
                    operation: 'create',
                    requestResourceData: { user: userData, username: usernameData },
                });
                errorEmitter.emit('permission-error', permissionError);
                setIsSubmitting(false);
            });

    } catch (error) {
        console.error("Error during username check:", error);
        // Toast is not shown here because the error is thrown and displayed by the listener
        setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Image
        src="/images/GamerF.jpg"
        alt="Gaming background"
        fill
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-background/90">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">
              Just a few more details to get you started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="Your unique nickname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Conditionally render Email field */}
                {!user?.email && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                         <FormDescription>
                          We need an email to contact you about your account.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="day"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger></FormControl>
                            <SelectContent><SelectGroup>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                            <SelectContent><SelectGroup>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                            <SelectContent><SelectGroup>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectGroup></SelectContent>
                          </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormMessage>{form.formState.errors.day?.message}</FormMessage>
                </FormItem>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Confirm Your Age</AlertTitle>
                  <AlertDescription className="text-xs">
                    By creating an account, you confirm your date of birth is correct. Providing false information may result in a permanent ban.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
