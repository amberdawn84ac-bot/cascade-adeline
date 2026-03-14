import React from 'react';
import { redirect } from 'next/navigation';

export default function ParentDashboard() {
  // Parent portal has been consolidated into the unified Family Portal at /dashboard/teacher
  redirect('/dashboard/teacher');
}
