import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Redirect to Learning Tree as the main landing page
  redirect('/tree');
}

