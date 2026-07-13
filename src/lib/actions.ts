import { addToast } from './toasts.svelte';

export function copyToClipboard(
	node: HTMLButtonElement,
	{ value, message }: { value: string; message: string }
) {
	if (value) {
		const listener = () => {
			navigator.clipboard.writeText(value).then(() => {
				addToast(message, 'success');
			});
		};

		node.addEventListener('click', listener);
	}
}
