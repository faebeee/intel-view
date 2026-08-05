import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JSX } from "react";

type PaginationProps = {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	totalItems: number;
	itemsPerPage: number;
};

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	totalItems,
	itemsPerPage,
}: PaginationProps): JSX.Element {
	if (totalPages <= 1) {
		return (
			<div className="flex justify-end text-xs text-sea-ink-soft italic font-medium px-2">
				Showing all {totalItems} {totalItems === 1 ? "note" : "notes"}
			</div>
		);
	}

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
			<div className="text-xs md:text-sm text-sea-ink-soft">
				Showing <span className="font-semibold text-sea-ink">{startItem}</span>{" "}
				to <span className="font-semibold text-sea-ink">{endItem}</span> of{" "}
				<span className="font-semibold text-sea-ink">{totalItems}</span> notes
			</div>

			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="p-1.5 rounded border border-line bg-chip-bg text-sea-ink hover:bg-sea-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
					title="Previous page"
					type="button"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>

				<div className="flex items-center gap-1 px-1">
					{Array.from({ length: totalPages }, (_, index) => {
						const pageNum = index + 1;
						const isCurrent = pageNum === currentPage;

						return (
							<button
								key={pageNum}
								onClick={() => onPageChange(pageNum)}
								className={`w-8 h-8 rounded text-xs font-bold transition-all ${
									isCurrent
										? "bg-palm text-white shadow-sm"
										: "bg-chip-bg text-sea-ink border border-line hover:bg-sea-ink/5"
								}`}
								type="button"
							>
								{pageNum}
							</button>
						);
					})}
				</div>

				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="p-1.5 rounded border border-line bg-chip-bg text-sea-ink hover:bg-sea-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
					title="Next page"
					type="button"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
