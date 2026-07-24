import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string; employeeId: string } }
) {
  return NextResponse.json({
    userId: params.employeeId,
    name: "John Doe",
    position: "Software Engineer",
    totalCommits: 18,
    codingHours: "24h 30m",
    filesEdited: 45,
    attendanceStats: {
      present: 4,
      absent: 1,
      halfDay: 0,
      weekend: 2
    },
    productivityScore: 92,
    timeline: [
      { day: "Monday", events: ["Fixed Login API", "Added JWT Validation", "4 commits"], status: "present" },
      { day: "Tuesday", events: ["Dashboard UI", "Attendance API", "6 commits"], status: "present" },
      { day: "Wednesday", events: ["Absent"], status: "absent" },
      { day: "Thursday", events: ["Team Assignment", "Email Notification"], status: "present" },
      { day: "Friday", events: ["Bug Fixes", "Final Testing"], status: "present" },
      { day: "Saturday", events: [], status: "weekend" },
      { day: "Sunday", events: [], status: "weekend" },
    ],
    summary: "This week the employee focused on authentication improvements, dashboard enhancements, team assignment functionality, email notification integration, and production bug fixes. A total of 18 commits were made with approximately 24 hours of coding activity."
  });
}
