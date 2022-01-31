export function dropComponents(url: string, count: number): string {
	while (count--) {
		const index = url.indexOf('/', 1);
		if (index === -1) {
			return '/';
		}
		url = url.substr(index);
	}
	return url;
}
