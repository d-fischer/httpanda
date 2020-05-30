import { ServerResponse } from 'http';
import { NextFunction } from './HttpServer';
import { pathToRegex } from './pathToRegex';
import { Request } from './Request';

export type RouteCallback = (req: Request, res: ServerResponse, next: NextFunction) => void;

export type HttpMethod = 'HEAD' | 'OPTIONS' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE';

export interface RouteHandler {
	regex: RegExp;
	method?: HttpMethod;
	paramNames: string[];
	callbacks: RouteCallback[];
}

export interface FoundCallbacks {
	params: Record<string, string>;
	callbacks: RouteCallback[];
}

export class Router {
	routes: RouteHandler[] = [];

	use(path: string, ...callbacks: RouteCallback[]) {
		if (callbacks.length) {
			const [regex, paramNames] = pathToRegex(path, false);
			this.routes.push({ regex, paramNames, callbacks });
		}
		return this;
	}

	add(method: HttpMethod | undefined, path: string, ...callbacks: RouteCallback[]) {
		if (callbacks.length) {
			const [regex, paramNames] = pathToRegex(path);
			this.routes.push({ regex, method, paramNames, callbacks });
		}
		return this;
	}

	find(requestMethod: HttpMethod, requestPath: string): FoundCallbacks[] {
		// we need this because GET handlers also need to respond to HEAD - and we don't want to check it on every iteration
		const isHead = requestMethod === 'HEAD';
		const foundCallbacks: FoundCallbacks[] = [];

		for (const { regex, method, paramNames, callbacks } of this.routes) {
			if (!method || method === requestMethod || (isHead && method === 'GET')) {
				if (paramNames.length) {
					const matches = regex.exec(requestPath);
					if (matches) {
						const params: Record<string, string> = {};
						let i = 1;
						for (const paramName of paramNames) {
							params[paramName] = matches[i++];
						}
						foundCallbacks.push({ params: params, callbacks });
					}
				} else if (regex.test(requestPath)) {
					foundCallbacks.push({ params: {}, callbacks });
				}
			}
		}

		return foundCallbacks;
	}
}
