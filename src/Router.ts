import { pathToRegex } from './pathToRegex';
import { FoundCallback, HttpMethod, RequestHandler, RouteLayer } from './types';

export class Router {
	routes: RouteLayer[] = [];

	all = this.add.bind(this, undefined);
	head = this.add.bind(this, 'HEAD');
	options = this.add.bind(this, 'OPTIONS');
	get = this.add.bind(this, 'GET');
	post = this.add.bind(this, 'POST');
	put = this.add.bind(this, 'PUT');
	patch = this.add.bind(this, 'PATCH');
	delete = this.add.bind(this, 'DELETE');
	connect = this.add.bind(this, 'CONNECT');
	trace = this.add.bind(this, 'TRACE');

	use(path: string, ...callbacks: RequestHandler[]): this {
		if (callbacks.length) {
			const [regex, paramNames, componentsToDrop] = pathToRegex(path, false);
			this.routes.push({ regex, paramNames, callbacks, componentsToDrop });
		}
		return this;
	}

	add(method: HttpMethod | undefined, path: string, ...callbacks: RequestHandler[]): this {
		if (callbacks.length) {
			const [regex, paramNames] = pathToRegex(path);
			this.routes.push({ regex, method, paramNames, callbacks, componentsToDrop: 0 });
		}
		return this;
	}

	find(requestMethod: HttpMethod, requestPath: string): FoundCallback[] {
		// we need this because GET handlers also need to respond to HEAD - and we don't want to check it on every iteration
		const isHead = requestMethod === 'HEAD';
		const foundCallbacks: FoundCallback[] = [];

		for (const { regex, method, paramNames, callbacks, componentsToDrop } of this.routes) {
			if (!method || method === requestMethod || (isHead && method === 'GET')) {
				if (paramNames.length) {
					const matches = regex.exec(requestPath);
					if (matches) {
						const params: Record<string, string> = {};
						let i = 1;
						for (const paramName of paramNames) {
							params[paramName] = matches[i++];
						}
						foundCallbacks.push(...callbacks.map(callback => ({ params, callback, componentsToDrop })));
					}
				} else if (regex.test(requestPath)) {
					foundCallbacks.push(...callbacks.map(callback => ({ params: {}, callback, componentsToDrop })));
				}
			}
		}

		return foundCallbacks;
	}
}
