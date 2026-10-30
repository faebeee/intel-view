/**
 * Date formatting for the mission-control design: ISO style in the user's
 * local time zone (handoff §06 — "YYYY-MM-DD HH:mm in mono").
 */

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

/** `2026-10-20` */
export function formatIsoDate(value: string | Date): string {
	const date = new Date(value);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `2026-10-20 14:27` */
export function formatIsoDateTime(value: string | Date): string {
	const date = new Date(value);
	return `${formatIsoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
