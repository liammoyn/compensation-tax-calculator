import type { ExerciseEvent, VestEvent } from "../types";

/** Aggregate fractional vest events → shares per calendar year. */
export function sharesVestedPerYear(
	vestingSchedule: VestEvent[],
	sharesGranted: number,
): Map<number, number> {
	const result = new Map<number, number>();
	for (const event of vestingSchedule) {
		const shares = event.sharesFraction * sharesGranted;
		result.set(event.year, (result.get(event.year) ?? 0) + shares);
	}
	return result;
}

/** Aggregate fractional exercise events → shares per calendar year. */
export function sharesExercisedPerYear(
	exerciseSchedule: ExerciseEvent[],
	sharesGranted: number,
): Map<number, number> {
	const result = new Map<number, number>();
	for (const event of exerciseSchedule) {
		const shares = event.sharesFraction * sharesGranted;
		result.set(event.year, (result.get(event.year) ?? 0) + shares);
	}
	return result;
}
