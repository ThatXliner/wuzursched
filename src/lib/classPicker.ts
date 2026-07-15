export function pinSelectedItem<T extends { item: { id: string } }>(
	items: T[],
	selected: string | null | undefined
): T[] {
	const selectedIndex = items.findIndex(({ item }) => item.id === selected);

	if (selectedIndex <= 0) {
		return items;
	}

	return [
		items[selectedIndex],
		...items.slice(0, selectedIndex),
		...items.slice(selectedIndex + 1)
	];
}
