import type * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";

type ConfirmationButtonProps = Omit<
	React.ComponentProps<typeof Button>,
	"onClick"
> & {
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	/** Custom trigger element (e.g. an `McButton`); replaces the default `Button`. */
	trigger?: React.ReactElement;
};

export function ConfirmationButton({
	onClick,
	title = "Are you sure?",
	description = "This action cannot be undone.",
	confirmText = "Confirm",
	cancelText = "Cancel",
	trigger,
	children,
	...buttonProps
}: ConfirmationButtonProps) {
	const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (onClick) {
			onClick(e);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{trigger ?? <Button {...buttonProps}>{children}</Button>}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelText}</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={handleConfirm}>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
