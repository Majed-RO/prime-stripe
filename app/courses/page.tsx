import CourseCard from '@/components/CourseCard';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser'
import React from 'react'

const AllCoursesPage = async () => {
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const courses = await convex.query(api.courses.getCourses)

  return (
    <div className='container mx-auto py-8 px-4'>
    <h1 className='text-3xl font-bold mb-8'>All Courses</h1>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard course={course} key={course._id} />
      ))}
    </div>
    </div>
  )
}

export default AllCoursesPage