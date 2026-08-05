import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard, MapPin, StickyNote } from "lucide-react";
import type { JSX } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home(): JSX.Element {
	return (
		<div className="page-wrap py-16 flex flex-col items-center justify-center min-h-screen text-center">
			<div className="max-w-2xl space-y-8 rise-in">
				{/* Hero Kicker */}
				<div className="flex justify-center">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-palm/10 text-palm font-bold text-xs rounded-full border border-palm/20 uppercase tracking-widest">
						<StickyNote className="w-3.5 h-3.5" />
						<span>Intel View Suite</span>
					</div>
				</div>

				{/* Hero Title */}
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-sea-ink tracking-tight display-title leading-tight">
					Smarter Location-Based <br />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-palm via-lagoon-deep to-lagoon">
						Notes Management
					</span>
				</h1>

				{/* Hero Description */}
				<p className="text-base sm:text-lg text-sea-ink-soft leading-relaxed max-w-lg mx-auto">
					Intel View gives you instant dashboard control over geo-tagged notes.
					Pin notes with precise latitude and longitude coordinates.
				</p>

				{/* Call to Actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
					<Link
						to="/nodes"
						className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-palm hover:bg-palm/90 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all"
					>
						<LayoutDashboard className="w-5 h-5" />
						<span>Launch Notes Dashboard</span>
						<ArrowRight className="w-4 h-4" />
					</Link>
				</div>

				{/* Core Features Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12">
					<div className="island-shell p-6 rounded-lg border border-line text-left bg-surface/50">
						<div className="p-2.5 bg-palm/15 text-palm rounded-lg w-fit mb-4">
							<StickyNote className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-sea-ink mb-1.5 display-title">
							Complete Notes CRUD
						</h3>
						<p className="text-xs sm:text-sm text-sea-ink-soft leading-relaxed">
							Create, read, update, and soft-delete rich notes. The full state
							is kept persistent in your local PostgreSQL database.
						</p>
					</div>

					<div className="island-shell p-6 rounded-lg border border-line text-left bg-surface/50">
						<div className="p-2.5 bg-lagoon-deep/15 text-lagoon-deep rounded-lg w-fit mb-4">
							<MapPin className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-sea-ink mb-1.5 display-title">
							Geolocation Coordinates
						</h3>
						<p className="text-xs sm:text-sm text-sea-ink-soft leading-relaxed">
							Tag any note with precise latitude and longitude. Utilize the
							built-in browser Geolocation API to fetch coordinates in a single
							click.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
