import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Redirect to Learning Path (Journey) as the default landing page
  redirect('/dashboard/journey');
}

