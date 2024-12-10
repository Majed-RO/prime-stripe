'use client';

import { Id } from '@/convex/_generated/dataModel';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { CheckCircle, Loader2Icon } from 'lucide-react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';
import { Skeleton } from './ui/skeleton';

const PurchaseButton = ({ courseId }: { courseId: Id<'courses'> }) => {
	const { user } = useUser();
	const userData = useQuery(
		api.users.getUserByClerkId,
		user ? { clerkId: user?.id } : 'skip'
	);

	const [isLoading, setIsLoading] = useState(false);

	const createCheckoutSession = useAction(
		api.stripe.createCheckoutSession
	);

	const userAccess = useQuery(
		api.users.getUserAccess,
		userData
			? {
					userId: userData?._id,
					courseId
				}
			: 'skip'
	) || { hasAccess: false, accessType: 'none' };

	const handlePurchase = async () => {
		if (!user) return toast.error('Please log in to purchase', {id: 'login-error'});

		setIsLoading(true);

		try {
			const { checkoutUrl } = await createCheckoutSession({
				courseId
			});

			if (checkoutUrl) {
				window.location.href = checkoutUrl;
			} else {
				throw new Error(
					'Failed to create checkout session'
				);
			}
		} catch (error: unknown | ConvexError<string>) {
			if (error instanceof Error) {
				if (
					error?.message.includes(
						'Rate limit exceeded'
					)
				) {
					toast.error(
						'You have tried too many times, please try again later.'
					);
				} else {
					toast.error(
						error.message ||
							'something went wrong. Please try again later.'
					);
				}
				return;
			}

			if (error instanceof ConvexError) {
				toast.error(
					error.data ||
						'something went wrong. Please try again later.'
				);
        return
			}

      toast.error(
          'Unknown error.'
      );
		} finally {
			setIsLoading(false);
		}
	};

  if (!userAccess || userAccess.accessType === 'none') {
		return (
			<Skeleton className='w-20 h-5' />
		);
	}

	if ( !userAccess.hasAccess) {
		return (
			<Button
				variant={'outline'}
				onClick={handlePurchase}
				disabled={isLoading}
			>
				Enroll Now
			</Button>
		);
	}

	if (userAccess.hasAccess) {
		return <div className='border-green-300 text-green-500 ' title='Enrolled'><CheckCircle className='size-4' /></div>;
	}

	if (isLoading) {
		return (
			<Button variant={'outline'}>
				<Loader2Icon className="mr-2 size-4 animate-spin" />
				Processing...
			</Button>
		);
	}
};

export default PurchaseButton;
