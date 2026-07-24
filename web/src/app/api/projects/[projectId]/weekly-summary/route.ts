import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week') || "2026-07-20"; // Expected format YYYY-MM-DD representing Monday

  // Generate the 7 days of the week starting from the given date
  const startDate = new Date(week);
  const weeklyCalendar = [];
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Default statuses to make it look realistic for the mock
  const mockStatuses = ["present", "present", "absent", "present", "present", "weekend", "weekend"];
  const mockCommits = [12, 15, 8, 20, 27, 0, 0];
  const mockHours = ["24h", "28h", "16h", "32h", "36h", "0h", "0h"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    weeklyCalendar.push({
      day: daysOfWeek[i],
      date: d.getDate().toString(),
      fullDate: d.toISOString().split('T')[0],
      status: mockStatuses[i],
      commits: mockCommits[i],
      hours: mockHours[i]
    });
  }

  return NextResponse.json({
    week,
    teamMembers: 6,
    totalCommits: 82,
    codingHours: "186h",
    productivityScore: 88,
    weeklyCalendar,
    heatmap: [
      {
        id: "emp-1",
        name: "John",
        attendance: ["present", "present", "absent", "present", "present"]
      },
      {
        id: "emp-2",
        name: "Sarah",
        attendance: ["present", "present", "present", "present", "present"]
      },
      {
        id: "emp-3",
        name: "Alex",
        attendance: ["absent", "absent", "present", "present", "present"]
      }
    ]
  });
}
