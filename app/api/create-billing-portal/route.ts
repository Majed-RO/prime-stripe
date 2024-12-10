import { api } from '@/convex/_generated/api';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { NextResponse } from 'next/server';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
	// get userId from clerk
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json(
			{ error: 'Not authenticated' },
			{ status: 404 }
		);
	}

	try {
		const user = await convex.query(api.users.getUserByClerkId, {
			clerkId: userId
		});

		if (!user || !user.stripeCustomerId) {
			return NextResponse.json(
				{
					error: 'User not found or no stripe customer ID'
				},
				{ status: 404 }
			);
		}

		// create the billing portal
		const session = await stripe.billingPortal.sessions.create({
			customer: user.stripeCustomerId,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.log('Error creating billing portal session:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
