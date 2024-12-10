import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createUser = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		clerkId: v.string(),
		stripeCustomerId: v.string() // added late
	},
	handler: async (ctx, args) => {
		// check if user exist
		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_clerkId', q =>
				q.eq('clerkId', args.clerkId)
			)
			.unique();

		if (existingUser) {
			console.log('User already exist');

			return existingUser._id;
		}

		// if the user is new, save it to db
		const userId = await ctx.db.insert('users', {
			email: args.email,
			name: args.name,
			clerkId: args.clerkId,
			stripeCustomerId: args.stripeCustomerId // added late
		});

		return userId;
	}
});

export const getUserByClerkId = query({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('users')
			.withIndex('by_clerkId', q =>
				q.eq('clerkId', args.clerkId)
			)
			.unique();
	}
});

export const getUserByStripeCustomerId = query({
	args: { stripeCustomerId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('users')
			.withIndex('by_stripeCustomerId', q =>
				q.eq('stripeCustomerId', args.stripeCustomerId)
			)
			.unique();
	}
});

/* 
function to check if user has access to any subscription or has bought any specific course
*/
export const getUserAccess = query({
	args: { userId: v.id('users'), courseId: v.id('courses') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError('Unauthorized');
		}

		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new ConvexError('User not found');
		}

		// check if this user has subscription, if so, he has access to all courses
		if (user.currentSubscriptionId) {
			// get subscription which is related to this user (from user -> subscriptions table)
			const subscription = await ctx.db.get(
				user.currentSubscriptionId
			);

			if (subscription && subscription.status === 'active') {
				return {
					hasAccess: true,
					accessType: 'subscription'
				};
			}
		}

		// if the user don't have subscription plan, check if he purchase the course
		const purchase = await ctx.db
			.query('purchases')
			.withIndex('by_userId_and_courseId', q =>
				q
					.eq('userId', args.userId)
					.eq('courseId', args.courseId)
			)
			.unique();

		if (purchase) {
			return { hasAccess: true, accessType: 'course' };
		}

		return { hasAccess: false };
	}
});
