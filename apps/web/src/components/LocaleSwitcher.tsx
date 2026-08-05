// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale

import { m } from "#/paraglide/messages";
import { getLocale, locales, setLocale } from "#/paraglide/runtime";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";

export default function ParaglideLocaleSwitcher() {
	const currentLocale = getLocale();

	return (
		<section
			style={{
				display: "flex",
				gap: "0.5rem",
				alignItems: "center",
				color: "inherit",
			}}
			aria-label={m.language_label()}
		>
			<ButtonGroup>
				{locales.map((locale) => (
					<Button
						key={locale}
						onClick={() => setLocale(locale)}
						aria-pressed={locale === currentLocale}
						type="button"
						variant={locale === currentLocale ? "default" : "outline"}
					>
						{locale.toUpperCase()}
					</Button>
				))}
			</ButtonGroup>
		</section>
	);
}
