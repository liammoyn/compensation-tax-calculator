import { X } from "lucide-react";
import { INFO_REGISTRY } from "../docs/fieldInfo";
import { Button } from "./ui/button";

interface Props {
	field: string | null;
	onClose: () => void;
}

export function InfoPanel({ field, onClose }: Props) {
	const info = field ? INFO_REGISTRY[field] : null;
	const open = field !== null && info !== undefined;

	return (
		<>
			{open && (
				<button
					type="button"
					aria-label="Close panel"
					className="fixed inset-0 z-30 cursor-default bg-transparent border-0 p-0"
					onClick={onClose}
					onKeyDown={(e) => e.key === "Escape" && onClose()}
				/>
			)}
			<div
				className={`fixed top-0 right-0 h-full w-80 bg-card border-l shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
					open ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between px-5 py-4 border-b">
					<h2 className="text-sm font-semibold tracking-tight">
						{info?.title ?? ""}
					</h2>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-muted-foreground hover:text-foreground"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-muted-foreground leading-relaxed">
					{info?.description}
				</div>
			</div>
		</>
	);
}
