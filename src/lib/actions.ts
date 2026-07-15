import { addToast } from './toasts.svelte';

export function copyToClipboard(
	node: HTMLButtonElement,
	options: { value: string; message: string }
) {
	const listener = () => {
		if (!options.value) return;
		navigator.clipboard
			.writeText(options.value)
			.then(() => addToast(options.message, 'success'))
			.catch(() => addToast('Could not copy to the clipboard', 'error'));
	};

	node.addEventListener('click', listener);
	return {
		update(nextOptions: { value: string; message: string }) {
			options = nextOptions;
		},
		destroy() {
			node.removeEventListener('click', listener);
		}
	};
}
