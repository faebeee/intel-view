import { toast } from "sonner";

/**
 * Copies a string to the system clipboard.
 *
 * The async Clipboard API is only available in secure contexts and can be
 * rejected by the browser (e.g. when the document is not focused), so this
 * helper surfaces a failure toast instead of silently doing nothing.
 *
 * @param text The text to place on the clipboard.
 * @returns `true` when the text was copied, `false` otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.error("Failed to copy to clipboard:", error);
		toast.error("Failed to copy to clipboard", {
			description:
				error instanceof Error ? error.message : "Ensure the api is online.",
		});
		return false;
	}
}
