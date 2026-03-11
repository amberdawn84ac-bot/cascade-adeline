import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// Server Actions for credit approval/rejection
async function approveCredit(formData: FormData) {
  'use server';
  
  try {
    const creditId = formData.get('creditId') as string;
    const user = await getSessionUser();
    if (!user || user.role !== 'PARENT') {
      throw new Error('Unauthorized');
    }

    // Update the transcript entry to mark it as approved by this parent
    await prisma.transcriptEntry.update({
      where: { id: creditId },
      data: {
        approvedById: user.userId,
      },
    });

    // Revalidate the page to show updated data
    redirect('/parent');
  } catch (error) {
    console.error('Error approving credit:', error);
    throw error;
  }
}

async function rejectCredit(formData: FormData) {
  'use server';
  
  try {
    const creditId = formData.get('creditId') as string;
    const user = await getSessionUser();
    if (!user || user.role !== 'PARENT') {
      throw new Error('Unauthorized');
    }

    // Delete the transcript entry (rejecting the credit)
    await prisma.transcriptEntry.delete({
      where: { id: creditId },
    });

    // Revalidate the page to show updated data
    redirect('/parent');
  } catch (error) {
    console.error('Error rejecting credit:', error);
    throw error;
  }
}

export default async function ParentDashboard() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/login');
  }
  if (sessionUser.role !== 'PARENT') {
    return <div className="p-6">Unauthorized access.</div>;
  }

  // Fetch parent data with pending credits
  const parent = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      name: true,
      children: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          transcriptEntries: {
            where: {
              approvedById: null, // Only fetch pending entries
            },
            orderBy: { dateCompleted: 'desc' },
            select: {
              id: true,
              activityName: true,
              mappedSubject: true,
              creditsEarned: true,
              notes: true,
              dateCompleted: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return <div className="p-6">Parent not found.</div>;
  }

  // Calculate pending credits summary
  const totalPendingCredits = parent.children.reduce(
    (total, child) => total + child.transcriptEntries.reduce((sum, entry) => sum + Number(entry.creditsEarned), 0),
    0
  );

  const totalPendingEntries = parent.children.reduce(
    (total, child) => total + child.transcriptEntries.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Approval Portal</h1>
            <p className="text-gray-600 mt-1">Review and approve pending credits for {parent.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">{parent.name}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Credits</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPendingEntries}</div>
              <p className="text-xs text-muted-foreground">
                {totalPendingCredits.toFixed(2)} total credits awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parent.children.length}</div>
              <p className="text-xs text-muted-foreground">
                Active students in your account
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Review Needed</div>
              <p className="text-xs text-muted-foreground">
                Credits pending your approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Credits by Child */}
        <div className="space-y-6">
          {parent.children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{child.name}</CardTitle>
                    <CardDescription>
                      Grade {child.gradeLevel || 'Not specified'} • {child.transcriptEntries.length} pending credits
                    </CardDescription>
                  </div>
                  <Badge variant={child.transcriptEntries.length > 0 ? "destructive" : "secondary"}>
                    {child.transcriptEntries.length > 0 ? 'Action Required' : 'All Caught Up'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {child.transcriptEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No pending credits for {child.name}</p>
                    <p className="text-sm">All credits have been reviewed.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child.transcriptEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.activityName}</div>
                              {entry.notes && (
                                <div className="text-sm text-gray-500 mt-1">{entry.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.mappedSubject}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{Number(entry.creditsEarned).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(entry.dateCompleted), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <form action={approveCredit}>
                                <input type="hidden" name="creditId" value={entry.id} />
                                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </form>
                              <form action={rejectCredit}>
                                <input type="hidden" name="creditId" value={entry.id} />
                                <Button type="submit" size="sm" variant="destructive">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>About Credit Approval</CardTitle>
            <CardDescription>
              As a parent, you can review and approve credits earned by your children through various activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Approving Credits</h4>
                  <p className="text-sm text-gray-600">
                    Click "Approve" to confirm the credit and add it to your child's official transcript.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Rejecting Credits</h4>
                  <p className="text-sm text-gray-600">
                    Click "Reject" if you believe the credit was earned in error or needs revision.
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <p className="text-sm text-gray-500">
              All approved credits become part of your child's permanent academic record and contribute to their overall learning progress.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

