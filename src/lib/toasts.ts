import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
export type MessageType = 'info' | 'success' | 'error' | 'warning';
export type Message = { contents: string; type: MessageType; id: number; useRawHTML: boolean };

export const messages: Writable<Message[]> = writable([]);
type Options = { duration: number; useRawHTML: boolean };
export function addToast(message: string, type: MessageType = 'info', options: Options) {
	const id = Math.random();
	messages.update((x) => [
		...x,
		{ contents: message, type, id, useRawHTML: options?.useRawHTML ?? false }
	]);
	setTimeout(() => {
		messages.update((x) => x.filter((e) => e.id != id));
	}, options?.duration ?? 5000);
}
