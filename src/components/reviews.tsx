
'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { Review } from '@/lib/types';
import { Loader2, Star, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { Separator } from './ui/separator';

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
    const starClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };
    return (
        <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star
            key={i}
            className={cn(
                starClasses[size],
                i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
            )}
            />
        ))}
        </div>
    );
}

export function Reviews({ gameId }: { gameId: string }) {
  const { firestore, user } = useFirebase();

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return query(collection(firestore, 'reviews'), where('gameId', '==', gameId));
  }, [firestore, gameId]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);
  
  return (
    <section>
        <CardHeader className="p-0 mb-4">
            <CardTitle className="font-headline text-2xl">Ratings & Reviews</CardTitle>
        </CardHeader>

        {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : !reviews || reviews.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <p>No reviews yet.</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
        ) : (
             <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-lg bg-secondary p-4">
                    <div className="flex flex-col items-center">
                        <span className="text-5xl font-bold">{averageRating.toFixed(1)}</span>
                        <StarRating rating={averageRating} size="md" />
                        <span className="text-sm text-muted-foreground mt-1">
                            Based on {reviews.length} review{reviews.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* TODO: Add rating distribution bars */}
                </div>

                {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                         <Avatar className="h-10 w-10">
                            {/* In a real app, you would fetch the user's avatar URL */}
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{review.username || 'Anonymous'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(review.reviewDate.seconds * 1000, 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div className="my-1">
                                <StarRating rating={review.rating} size="sm" />
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                    </div>
                ))}
             </div>
        )}
        
        {/* Placeholder for writing a new review */}
        <div className="mt-8">
            <h3 className="font-headline text-xl mb-4">Write a Review</h3>
            {user ? (
                 <p className="text-muted-foreground border-2 border-dashed rounded-lg p-12 text-center">
                    Review submission coming soon...
                 </p>
            ) : (
                <p className="text-muted-foreground border-2 border-dashed rounded-lg p-12 text-center">
                    You must be <Link href="/login" className="text-primary underline">logged in</Link> and own the game to write a review.
                </p>
            )}
        </div>

    </section>
  );
}
