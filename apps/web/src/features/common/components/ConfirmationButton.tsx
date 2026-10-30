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
};

export function ConfirmationButton({
	onClick,
	title = "Are you sure?",
	description = "This action cannot be undone.",
	confirmText = "Confirm",
	cancelText = "Cancel",
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
				<Button {...buttonProps}>{children}</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelText}</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm}>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
