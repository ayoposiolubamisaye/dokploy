import { useEffect, type RefObject } from "react";

type FocusableElement = HTMLInputElement | HTMLTextAreaElement;

const editableTagNames = new Set(["input", "textarea", "select"]);

const shouldIgnoreShortcut = (
	activeElement: Element | null,
	targetElement: HTMLElement | null,
) => {
	if (!activeElement || !("tagName" in activeElement)) {
		return false;
	}

	if (activeElement === targetElement) {
		return false;
	}

	const tagName = activeElement.tagName?.toLowerCase();

	if (editableTagNames.has(tagName)) {
		return true;
	}

	return (activeElement as HTMLElement).isContentEditable;
};

export const useSearchShortcut = (targetRef: RefObject<FocusableElement>) => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key.toLowerCase() !== "k") {
				return;
			}

			if (!(event.metaKey || event.ctrlKey)) {
				return;
			}

			const targetElement = targetRef.current;
			if (!targetElement) {
				return;
			}

			if (shouldIgnoreShortcut(document.activeElement, targetElement)) {
				return;
			}

			event.preventDefault();
			targetElement.focus();
			targetElement.select?.();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [targetRef]);
};

