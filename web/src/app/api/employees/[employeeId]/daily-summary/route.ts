import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  if (!dateStr) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  // Example mock for present day
  const isAbsent = dateStr.endsWith('02') || dateStr.endsWith('15'); // Just a mock condition

  if (isAbsent) {
    return NextResponse.json({
      attendance: "absent",
      checkIn: null,
      checkOut: null,
      workingHours: "0h 0m",
      commits: [],
      fileEdits: 0,
      timeline: [],
      summary: null,
    });
  }

  return NextResponse.json({
    attendance: "present",
    checkIn: "09:15 AM",
    checkOut: "06:20 PM",
    workingHours: "8h 45m",
    commits: [
      { id: "c1", message: "Added employee calendar component" },
      { id: "c2", message: "Fixed attendance bug" },
      { id: "c3", message: "Updated dashboard cards" },
      { id: "c4", message: "Refactored API routes" }
    ],
    fileEdits: 17,
    timeline: [
      { time: "09:20 AM", event: "Started working on Employee Dashboard." },
      { time: "11:05 AM", event: "Completed Attendance API." },
      { time: "12:15 PM", event: "Fixed sidebar responsive issue." },
      { time: "02:10 PM", event: "Implemented Team Assignment." },
      { time: "04:30 PM", event: "Code Review completed." },
      { time: "05:45 PM", event: "Pushed final commit." }
    ],
    summary: "The employee primarily worked on the Team Dashboard by implementing the attendance calendar, fixing responsive layout issues, improving API integration, and completing final testing before pushing production-ready commits."
  });
}
