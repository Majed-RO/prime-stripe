import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { Webhook } from 'svix';

import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from './_generated/api';
import stripe from '../lib/stripe';
import resend from '../lib/resend';
// import WelcomeEmail from '../emails/WelcomeEmail';

const http = httpRouter();

const clerkWebhook = httpAction(async (ctx, request) => {
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

	if (!webhookSecret) {
		throw new Error(
			'Missing CLERK_WEBHOOK_SECRET environment variable '
		);
	}

	// https://docs.svix.com/receiving/verifying-payloads/how-manual#:~:text=The%20svix%2Dsignature%20header%20is,be%20any%20number%20of%20signatures.

	// Each webhook call includes three headers with additional information that are used for verification:

	//svix-id: the unique message identifier for the webhook message. This identifier is unique across all messages, but will be the same when the same webhook is being resent (e.g. due to a previous failure).

	//svix-timestamp: timestamp in seconds since epoch.

	//svix-signature: the Base64 encoded list of signatures (space delimited).

	const svix_id = request.headers.get('svix-id');
	const svix_signature = request.headers.get('svix-signature');
	const svix_timestamp = request.headers.get('svix-timestamp');

	if (!svix_id || !svix_signature || !svix_timestamp) {
		return new Response('Error occurred -- no svix headers', {
			status: 400
		});
	}

	// if the webhook call is verified
	const payload = await request.json();
	const body = JSON.stringify(payload);

	// wh = webhook
	const wh = new Webhook(webhookSecret);

	let evt: WebhookEvent;

	// here you will verify that the call is really comes from clerk
	try {
		evt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-signature': svix_signature,
			'svix-timestamp': svix_timestamp
		}) as WebhookEvent;
	} catch (error) {
		console.log('Error verifying webhook:', error);

		return new Response('Error occurred -- svix not verified!', {
			status: 400
		});
	}

	const eventType = evt.type;

	if (eventType === 'user.created') {
		const { id, email_addresses, first_name, last_name } = evt.data;

		const email = email_addresses[0]?.email_address;
		const name = `${first_name || ''} ${last_name || ''}`.trim();

		try {
			// CREATE STRIPE CUSTOMER
			const customer = await stripe.customers.create({
				email,
				name,
				metadata: { clerkId: id }
			});

			// create new user in convex
			await ctx.runMutation(api.users.createUser, {
				email,
				name,
				clerkId: id,
				stripeCustomerId: customer.id
			});

			// in production, we must use another email(onboarding@resend.dev) in from, and to be added in resend dashboard / domains
      // react component didn't work in this webhook: 
			// react: <WelcomeEmail({ name, url: process.env.NEXT_PUBLIC_APP_URL! })  />,

			if (process.env.NODE_ENV === 'development') {
				const { error: err } =
					await resend.emails.send({
						from: 'MasterClass <onboarding@resend.dev>',
						to: email,
						subject: 'Welcome to MasterClass!',
						html: `<strong>Hey ${name}, congratulations!</strong>
            <br/>
            <div>We&apos;re thrilled to have you join our community of learners! You&apos;ve taken the first
							step towards mastering modern development skills through engaging, project-based learning.</div>
              <br/>
              <a href=${process.env
								.NEXT_PUBLIC_APP_URL!} target="_blank">Explore Courses</a>
              `
						/* react: WelcomeEmail({
							name,
							url: process.env
								.NEXT_PUBLIC_APP_URL!
						}) */
					});


				if (err) {
					console.error(
						'Error sending WelcomeEmail.',
						err
					);
					return new Response(
						`Error sending WelcomeEmail. ${err}`,
						{ status: 500 }
					);
				}
			}
		} catch (error) {
			console.error(
				'Error creating user in Stripe | Convex or while sending WelcomeEmail.',
				error
			);
			return new Response('Error creating user!', {
				status: 500
			});
		}
	}

	return new Response('Webhook processed successfully!', {
		status: 200
	});
});

/* create endpoint */
http.route({
	path: '/clerk-webhook',
	method: 'POST',
	handler: clerkWebhook
});

export default http;
