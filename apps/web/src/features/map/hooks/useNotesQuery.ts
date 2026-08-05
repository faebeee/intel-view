import type { Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";
import type { MapMarkerData } from "../types";

export function useNotesQuery() {
	return useQuery({
		queryKey: ["notes", "map"],
		queryFn: async () => {
			const response = await noteControllerFindAll({
				query: {
					"filter.lat": ["$not:$null"],
					"filter.lng": ["$not:$null"],
					limit: 100,
				},
			});

			const paginated = response.data as PaginatedResponse<Note>;

			// Map API Notes to MapMarkerData structure
			return (paginated?.data || [])
				.filter(
					(note): note is Note & { lat: number; lng: number } =>
						note.lat !== null &&
						note.lat !== undefined &&
						note.lng !== null &&
						note.lng !== undefined,
				)
				.map((note): MapMarkerData => {
					const contentClean = note.content.trim();
					const lines = contentClean.split("\n");
					const rawTitle = lines[0];

					// Extract a clean title (first line) and description (rest of content)
					const title =
						rawTitle.length > 35 ? `${rawTitle.substring(0, 35)}...` : rawTitle;
					const description =
						lines.length > 1 ? lines.slice(1).join("\n") : contentClean;

					return {
						id: String(note.id),
						lat: note.lat,
						lng: note.lng,
						title: title || `Sector Note #${note.id}`,
						category: "note",
						description: description || "No detailed coordinates recorded.",
						metadata: {
							classification: "Restricted",
							created: new Date(note.createdAt).toLocaleDateString(),
							noteId: `#${note.id}`,
						},
						tags: (note.tags || []).map((t) => ({
							id: t.id,
							name: t.name,
							color: t.color || "#38bdf8",
						})),
					};
				});
		},
	});
}
