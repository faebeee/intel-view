import { toast } from "sonner";

/**
 * Builds a `useMutation({ onError })` handler that logs the error and shows
 * a standardized failure toast. Used by every mutation in the app so the
 * "Failed to X" / "Ensure the api is online." messaging stays consistent.
 *
 * @param action Present-tense description of the failed action, e.g. "delete note".
 *
 * @example
 * useMutation({
 *   mutationFn: ...,
 *   onError: toastApiError("delete note"),
 * });
 */
export function toastApiError(action: string): (error: unknown) => void {
	return (error: unknown) => {
		console.error(`Failed to ${action}:`, error);
		toast.error(`Failed to ${action}`, {
			description:
				error instanceof Error ? error.message : "Ensure the api is online.",
		});
	};
}
