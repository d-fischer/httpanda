export function pathToRegex(path: string, strict = true): [RegExp, string[], number] {
	const parts = path.split('/');
	const paramNames: string[] = [];
	let pathComponents = 0;
	let re = '^';

	for (const part of parts) {
		if (part) {
			pathComponents++;
			if (part[0] === ':') {
				paramNames.push(part.substr(1));
				re += '/([^/]+?)';
			} else {
				re += `/${part}`;
			}
		}
	}

	re += strict ? '/?$' : '(?=/|$)';

	return [new RegExp(re), paramNames, pathComponents];
}
