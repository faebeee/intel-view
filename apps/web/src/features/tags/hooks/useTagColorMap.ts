import type { TagResponseDto as Tag } from "@repo/sdk";
import * as React from "react";

/**
 * Builds a lookup of lowercased tag name -> display color from the
 * global tag registry. Shared by every view that renders tag chips next
 * to a note (list, tree, detail panel, view modal), so a note's `tags`
 * (plain strings) can be resolved to their registered color.
 */
export function useTagColorMap(tags: Tag[]): Map<string, string> {
	return React.useMemo(() => {
		const map = new Map<string, string>();
		for (const tag of tags) {
			map.set(tag.name.toLowerCase(), tag.color);
		}
		return map;
	}, [tags]);
}
