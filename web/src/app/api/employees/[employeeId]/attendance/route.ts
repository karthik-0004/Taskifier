import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // optional, just to know which month we are mocking

  // Generate a mock response for the month
  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = month ? parseInt(month) : today.getMonth();

  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const attendance = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, currentMonth, i);
    const dayOfWeek = d.getDay();
    const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    let status = 'present';
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = 'weekend'; // Gray out
    } else if (i === 2 || i === 15) {
      status = 'absent';
    } else if (i === 10) {
      status = 'half-day';
    } else if (d > today) {
      status = 'future';
    }

    attendance.push({
      date: dateStr,
      status,
    });
  }

  return NextResponse.json(attendance);
}
