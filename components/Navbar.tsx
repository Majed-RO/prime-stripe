import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignOutButton,
	SignUpButton,
	UserButton
} from '@clerk/nextjs';
import {
	BookOpenIcon,
	CreditCardIcon,
	GraduationCap,
	LogOutIcon,
	Zap
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Button } from './ui/button';
import { ModeToggle } from './ModeToggle';

const Navbar = () => {
	return (
		<nav className="flex justify-between items-center py-4 px-6 bg-background border-b">
			{/* logo */}
			<Link
				href={'/'}
				className="text-xl font-extrabold text-primary flex items-center gap-2"
			>
				MasterClass <GraduationCap className="size-6" />
			</Link>

			{/* links in the right side */}
			<div className="flex items-center space-x-1 sm:space-x-4">
				<Link
					href={'/courses'}
					className="flex items-center gap-1 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
				>
					<BookOpenIcon className="size-4" />
					<span className="hidden sm:inline">
						Courses
					</span>
				</Link>

				<Link
					href={'/pro'}
					className="flex items-center gap-1 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
				>
					<Zap className="size-4" />
					<span className="hidden sm:inline">
						Pro
					</span>
				</Link>

				<SignedIn>
					<Link href={'/billing'}>
						<Button
							variant={'outline'}
							className="flex items-center gap-2"
							size={'sm'}
						>
							<CreditCardIcon className="size-4" />
							<span className="hidden sm:inline">
								Billing
							</span>
						</Button>
					</Link>
				</SignedIn>

				{/* only shown if user is signed in */}
				<UserButton />

				<SignedIn>
					<SignOutButton>
						<Button
							variant={'outline'}
							className="hidden sm:flex items-center gap-2"
							size={'sm'}
						>
							<LogOutIcon className="size-4" />
							<span className="hidden sm:inline">
								Log Out
							</span>
						</Button>
					</SignOutButton>
				</SignedIn>

				<SignedOut>
					<SignInButton mode="modal">
						<Button
							variant={'outline'}
							size={'sm'}
						>
							Log In
						</Button>
					</SignInButton>
				</SignedOut>

				<SignedOut>
					<SignUpButton mode="modal">
						<Button size={'sm'}>
							Sign Up
						</Button>
					</SignUpButton>
				</SignedOut>

        <ModeToggle />
			</div>
		</nav>
	);
};

export default Navbar;
