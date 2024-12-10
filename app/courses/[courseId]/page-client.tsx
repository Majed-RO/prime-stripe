'use client';

// import PurchaseButton from '@/components/PurchaseButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { Download, FileTextIcon, Lock, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { use } from 'react';

const CourseDetailsPage = ({
	params
}: {
	params: Promise<{ courseId: Id<'courses'> }>;
}) => {
	const courseId = use(params).courseId;

	// another way to get courseId
	/* const {courseId: courseId2} = useParams();
  console.log('params', courseId2); */

	const { user, isLoaded: isUserLoaded } = useUser();

	const userData = useQuery(api.users.getUserByClerkId, {
		clerkId: user?.id ?? ''
	});
	const courseData = useQuery(api.courses.getCourseById, {
		courseId: courseId ?? ''
	});

	// send the args once the userData is available
	const userAccess = useQuery(
		api.users.getUserAccess,
		userData
			? {
					userId: userData._id,
					courseId: courseId
				}
			: 'skip'
	) || { hasAccess: false };

	// in convex, they return undefined if data is not ready yet: undefined == loading
	if (!isUserLoaded || courseData === undefined) {
		return <CourseDetailsSkeleton />;
	}

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

					{userAccess.hasAccess ? (
						<>
							<p className="text-gray-600 mb-6">
								{
									courseData.description
								}
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
								<Button className="flex items-center justify-center space-x-2">
									<PlayCircle className="size-5" />
									<span>
										Start
										Course
									</span>
								</Button>

								<Button
									variant={
										'outline'
									}
									className="flex items-center justify-center space-x-2"
								>
									<Download className="size-5" />
									<span>
										Download
										Materials
									</span>
								</Button>
							</div>

							<h3 className="text-xl font-semibold mb-4">
								Course Modules
							</h3>
							<ul className="space-y-2">
								<li className="flex items-center space-x-2">
									<FileTextIcon className="size-5 text-gray-400 capitalize" />
									<span>
										introduction
										to
										advanced
										patterns
									</span>
								</li>
								<li className="flex items-center space-x-2">
									<FileTextIcon className="size-5 text-gray-400 capitalize" />
									<span>
										hooks
										and
										custom
										hooks
									</span>
								</li>
							</ul>
						</>
					) : (
						<div className="text-center">
							<div className="flex flex-col items-center space-y-4">
								<Lock className="w-16 h-16 text-gray-400" />
								<p className="text-lg text-gray-600">
									This
									course
									is
									locked.
								</p>
								<p className="text-gray-500 mb-4">
									Enroll
									in this
									course
									to
									access
									all
									premium
									content.
								</p>
								<p className="text-2xl font-bold mb-4">
									$
									{courseData.price.toFixed(
										2
									)}
								</p>
								{/* <PurchaseButton courseId={courseId} /> */}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default CourseDetailsPage;

function CourseDetailsSkeleton() {
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
}
