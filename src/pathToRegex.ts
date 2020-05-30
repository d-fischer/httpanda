export function pathToRegex(path: string, strict = true): [RegExp, string[]] {
	const parts = path.split('/');
	const paramNames: string[] = [];
	let re = '^';

	for (const part of parts) {
		if (part) {
			if (part[0] === ':') {
				paramNames.push(part.substr(1));
				re += '/([^/]+?)';
			} else {
				re += `/${part}`;
			}
		}
	}

	re += strict ? '/?$' : '(?=/|$)';

	return [new RegExp(re), paramNames];
}
