export type MessageType = 'info' | 'success' | 'error' | 'warning';
export type Message = { contents: string; type: MessageType; id: number; useRawHTML: boolean };

export const messages: Message[] = $state([]);
type Options = { duration: number; useRawHTML: boolean };
export function addToast(
	message: string,
	type: MessageType = 'info',
	options: Options = { duration: 5000, useRawHTML: false }
) {
	const id = Math.random();
	messages.push({ contents: message, type, id, useRawHTML: options.useRawHTML });
	setTimeout(() => {
		const index = messages.findIndex((e) => e.id === id);
		if (index !== -1) {
			messages.splice(index, 1);
		}
	}, options.duration);
}
