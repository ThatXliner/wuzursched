import { addToast } from './toasts';

export function copyToClipboard(
	node: HTMLButtonElement,
	{ value, message }: { value: string; message: string }
) {
	if (value) {
		const listener = () => {
			navigator.clipboard.writeText(value).then(() => {
				addToast('Room URL copied to clipboard', 'success');
			});
		};

		node.addEventListener('click', listener);
	}
}
