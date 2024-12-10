import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ProPlanActivatedEmail from '@/emails/ProPlanActivatedEmail';
import PurchaseConfirmationEmail from '@/emails/PurchaseConfirmationEmail';
import resend from '@/lib/resend';
import stripe from '@/lib/stripe';
import { isEmpty } from '@/lib/utils';
import { ConvexHttpClient } from 'convex/browser';
import Stripe from 'stripe';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
	const body = await req.text();

	const signature = req.headers.get('Stripe-Signature') as string;

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!
		);
	} catch (error) {
		console.log('Webhook Error', JSON.stringify(error));
		return new Response(`Webhook signature verification failed.`, {
			status: 400
		});
	}

	// Handle the event
	try {
		switch (event.type) {
			case 'checkout.session.completed':
				// define and call a function to handle the event checkout.session.completed
				await handleCheckoutSessionCompleted(
					event.data
						.object as Stripe.Checkout.Session
				);

				break;

			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				// define and call a function to handle the event checkout.session.completed
				await handleSessionUpsert(
					event.data
						.object as Stripe.Subscription,
					event.type
				);

				break;

			case 'customer.subscription.deleted':
				await handleSubscriptionDeleted(
					event.data.object as Stripe.Subscription
				);
				break;
			// ... handle other event types
			default:
				console.log(
					`Unhandled event type ${event.type}`
				);
				break;
		}
	} catch (error) {
		console.log(`Error processing webhook (${event.type})`, error);
		return new Response(`Error processing webhook.`, {
			status: 400
		});
	}

	// Return a 200 response to acknowledge receipt of the event
	return new Response(`succeeded`, {
		status: 200
	});
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session
) {
	// we sent the metadata when we have created the checkout session in first place!
	const courseId = session.metadata?.courseId;
	const userId = session.metadata?.userId;
	const stripeCustomerId = session.customer;

	if (!userId || !courseId || !stripeCustomerId) {
		throw new Error('Missing userId, courseId or stripeCustomerId');
	}

	await convex.mutation(api.purchases.recordPurchase, {
		userId: userId as Id<'users'>,
		courseId: courseId as Id<'courses'>,
		amount: session.amount_total as number,
		stripePurchaseId: session.id
	});

	// send success email to the user
	if (
		process.env.NODE_ENV === 'development' &&
		session.metadata &&
		!isEmpty(session.metadata)
	) {
		await resend.emails.send({
			from: 'MasterClass <onboarding@resend.dev>',
			to: session.metadata?.userEmail,
			subject: 'Purchase Confirmed!',
			react: PurchaseConfirmationEmail({
				customerName: session.metadata?.userName,
				courseTitle: session.metadata?.courseTitle,
				courseImage: session.metadata?.courseImageUrl,
				courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}`,
				purchaseAmount: session.amount_total! / 100
			})
		});
	}
}

async function handleSessionUpsert(
	subscription: Stripe.Subscription,
	eventType: string
) {
	/* This line to solve an issue of not completing the process - will save the status as incomplete! */
	if (subscription.status !== 'active' || !subscription.latest_invoice) {
		console.log(
			`Skipping subscription ${subscription.id} - status: ${subscription.status}`
		);
		return;
	}
	// we sent the metadata when we have created the checkout session in first place!
	const userId = subscription.metadata?.userId;
	const planId = subscription.metadata?.planId;
	const stripeCustomerId = subscription.customer as string;
	/* const user = await convex.query(api.users.getUserByStripeCustomerId, {
		stripeCustomerId
	}); */

	/* Test metadata */
	// console.log('SUBSCRIPTION: /////', subscription);

	if (!userId) {
		throw new Error(
			`User not found FOR CUSTOMER_ID: ${stripeCustomerId} }}`
		);
	}

	await convex.mutation(api.subscriptions.upsertSubscription, {
		userId: userId as Id<'users'>,
		stripeSubscriptionId: subscription.id,
		status: subscription.status,
		planType: planId as 'month' | 'year',
		//planType: subscription.items.data[0].plan.interval as | 'month' | 'year',
		currentPeriodStart: subscription.current_period_start,
		currentPeriodEnd: subscription.current_period_end,
		cancelAtPeriodEnd: subscription.cancel_at_period_end
	});

	console.log(
		`successfully processed ${eventType} for subscription ${subscription.id}`
	);

	// send success email to the user
	const isCreation = eventType === 'customer.subscription.created';
	const isUpdating = eventType === 'customer.subscription.updated';

	if (
		process.env.NODE_ENV === 'development' &&
		subscription.metadata &&
		!isEmpty(subscription.metadata)
	) {
		if (isCreation || isUpdating) {
			await resend.emails.send({
				from: 'MasterClass <onboarding@resend.dev>',
				to: subscription.metadata?.userEmail,
				subject: `${isCreation ? 'Welcome to MasterClass Pro!' : 'Your MasterClass Pro Plan has been updated!'}`,
				react: ProPlanActivatedEmail({
					name: subscription.metadata?.userName,
					planType: planId,
					currentPeriodStart:
						subscription.current_period_start,
					currentPeriodEnd:
						subscription.current_period_end,
					url: `${process.env.NEXT_PUBLIC_APP_URL}/courses}`
				})
			});
		}
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	try {
		await convex.mutation(api.subscriptions.removeSubscription, {
			stripeSubscriptionId: subscription.id
		});
		console.log(
			`Successfully deleted subscription ${subscription.id}`
		);
	} catch (error) {
		console.error(
			`Error deleting subscription ${subscription.id}:`,
			error
		);
	}
}
