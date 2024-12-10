import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { auth } from '@clerk/nextjs/server';
// import { ConvexHttpClient } from 'convex/browser';
import { fetchQuery } from 'convex/nextjs';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProContent from './ProContent';

async function getUserData(userId: string) {
	return await fetchQuery(api.users.getUserByClerkId, {
		clerkId: userId ?? ''
	});
}

async function getCourseData(courseId: Id<'courses'>) {
	return await fetchQuery(api.courses.getCourseById, {
		courseId: courseId ?? ''
	});
}

const CourseDetailsPage = async ({
	params
}: {
	params: Promise<{ courseId: Id<'courses'> }>;
}) => {
	const courseId = (await params).courseId;

	// Get the userId from auth() - clerk -- if null, the user is not signed in
	const { userId } = await auth();

	const user = getUserData(userId as string);
	const course = getCourseData(courseId);

	// Initiate both requests in parallel
	const [userData, courseData] = await Promise.all([user, course]);
	

	// in convex, they return undefined if data is not ready yet: undefined == loading
	/* if (courseData === undefined) {
		return <CourseDetailsSkeleton />;
	} */

	if (courseData === null) {
		return notFound();
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<Card>
				<CardHeader>
					<Image
						src={courseData.imageUrl}
						alt={courseData.title}
						width={1200}
						height={1200}
						className="rounded-md object-cover w-full"
					/>
				</CardHeader>

				<CardContent>
					<CardTitle className="text-3xl mb-4">
						{courseData.title}
					</CardTitle>

          <ProContent userData={userData} courseData={courseData} />

					
				</CardContent>
			</Card>
		</div>
	);
};

export default CourseDetailsPage;

/* function CourseDetailsSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<Card className="max-w-4xl mx-auto">
				<CardHeader>
					<Skeleton className="w-full h-[600px] rounded-md" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-10 w-3/4 mb-4" />
					<Skeleton className="h-4 w-full mb-2" />
					<Skeleton className="h-4 w-full mb-2" />
					<Skeleton className="h-4 w-2/3 mb-6" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
} */
