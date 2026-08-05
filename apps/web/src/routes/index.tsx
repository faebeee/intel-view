import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home(): JSX.Element {
	return <div></div>;
}
