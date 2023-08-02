import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
export type MessageType = 'info' | 'success' | 'error' | 'warning';
export type Message = { contents: string; type: MessageType; id: number };

export const messages: Writable<Message[]> = writable([]);
export function addToast(message: string, type: MessageType = 'info', duration = 5000) {
	const id = Math.random();
	messages.update((x) => [...x, { contents: message, type, id }]);
	setTimeout(() => {
		messages.update((x) => x.filter((e) => e.id != id));
	}, duration);
}