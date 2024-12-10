'use client';

import PurchaseButton from '@/components/PurchaseButton';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Download, FileTextIcon, Lock, PlayCircle } from 'lucide-react';
import React from 'react';

const ProContent = ({
	userData,
	courseData
}: {
	userData: Doc<'users'> | null;
	courseData: Doc<'courses'>;
}) => {
	const userAccess = useQuery(
		api.users.getUserAccess,
		userData
			? {
					userId: userData._id,
					courseId: courseData._id
				}
			: 'skip'
	) || { hasAccess: false };

	return (
		<>
			{userAccess.hasAccess ? (
				<>
					<p className="text-gray-600 mb-6">
						{courseData.description}
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
						<Button className="flex items-center justify-center space-x-2">
							<PlayCircle className="size-5" />
							<span>
								Start Course
							</span>
						</Button>

						<Button
							variant={'outline'}
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
								introduction to
								advanced
								patterns
							</span>
						</li>
						<li className="flex items-center space-x-2">
							<FileTextIcon className="size-5 text-gray-400 capitalize" />
							<span>
								hooks and custom
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
							This course is locked.
						</p>
						<p className="text-gray-500 mb-4">
							Enroll in this course to
							access all premium
							content.
						</p>
						<p className="text-2xl font-bold mb-4">
							$
							{courseData.price.toFixed(
								2
							)}
						</p>
						<PurchaseButton
							courseId={
								courseData._id
							}
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default ProContent;
