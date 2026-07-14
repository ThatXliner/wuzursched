export function formatClassUsage(count: number | null) {
	const value = count ?? 0;
	return `${value} ${value === 1 ? 'schedule' : 'schedules'}`;
}
