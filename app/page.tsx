// version 0.1

import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';

import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/* 
'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function Home() {
	const tasks = useQuery(api.tasks.getAllTasks);

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			{tasks?.map(({ _id, text }) => (
				<div key={_id}>{text}</div>
			))}
		</main>
	);
} */

// version 0.2
export default async function Home() {
	const convex = new ConvexHttpClient(
		process.env.NEXT_PUBLIC_CONVEX_URL!
	);
	const courses = await convex.query(api.courses.getCourses);

	return (
		<div className="flex min-h-screen flex-col ">
			<main className="flex-grow container mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
						Forge Your Path in Modern
						Development
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Master fullstack skills through
						engaging, project-based
						learning. Unlock your potential
						with MasterClass.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
					{courses.slice(0, 3).map(course => (
						<CourseCard
							course={course}
							key={course._id}
						/>
					))}
				</div>

				<div className="text-center">
					<Link href="/pro">
						<Button
							size="lg"
							className="group hover:bg-purple-600 transition-colors duration-300"
						>
							Explore Pro Plans
							<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
						</Button>
					</Link>
				</div>
			</main>
		</div>
	);
}
