import { parseUrl } from './parseUrl';
import { Request } from './Request';
import { HttpMethod, RouteCallback, Router } from './Router';
import { createServer, Server as HttpServer, ServerResponse, STATUS_CODES } from 'http';
import { ListenOptions } from 'net';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorType = any;

export type NextFunction = (e?: ErrorType) => void;
export type ErrorHandler = (e: ErrorType, req: Request, res: ServerResponse, next: NextFunction) => void;

export interface HttpServerOptions {
	server?: HttpServer;
	onError?: ErrorHandler;
}

const defaultOnError: ErrorHandler = (e, req, res) => {
	res.statusCode = e.code || e.status || 500;
	if (typeof e === 'string') {
		res.end(e);
	} else {
		res.end(e.message || STATUS_CODES[res.statusCode] || 'Unknown error');
	}
};

export class Server extends Router {
	private _httpServer?: HttpServer;
	private readonly _onError: ErrorHandler;
	private readonly _on404: RouteCallback;

	constructor({ server, onError }: HttpServerOptions = {}) {
		super();
		this._httpServer = server;
		this._onError = onError || defaultOnError;
		this._on404 = this._onError.bind(null, { code: 404 });
	}

	async listen(port?: number, hostname?: string, backlog?: number): Promise<this>;
	async listen(port?: number, hostname?: string): Promise<this>;
	async listen(port?: number, backlog?: number): Promise<this>;
	async listen(port?: number): Promise<this>;
	async listen(options: ListenOptions): Promise<this>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async listen(handle: any, backlog?: number): Promise<this>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async listen(handle: any): Promise<this>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async listen(...args: any[]): Promise<this> {
		return new Promise((resolve, reject) => {
			if (!this._httpServer) {
				this._httpServer = createServer();
			}
			this._httpServer.on('request', this.handleRequest);
			this._httpServer.listen.call(this._httpServer, ...args, (e: Error) => {
				if (e) {
					reject(e);
				} else {
					resolve(this);
				}
			});
		});
	}

	use(...fns: RouteCallback[]): this;
	use(path: string, ...fns: RouteCallback[]): this;
	use(pathOrFn: RouteCallback | string, ...fns: RouteCallback[]): this {
		const path = (typeof pathOrFn === 'string' && pathOrFn) || '/';
		const callbacks = typeof pathOrFn === 'string' ? fns : [pathOrFn, ...fns];

		return super.use(path, ...callbacks);
	}

	handleRequest = (req: Request, res: ServerResponse): void => {
		const parsedUrl = parseUrl(req);
		const foundRoutes = this.find(req.method! as HttpMethod, parsedUrl.pathname);
		foundRoutes.push({
			callbacks: [this._on404],
			params: {}
		});
		const routeCount = foundRoutes.length;
		req.path = parsedUrl.pathname;
		req.query = parsedUrl.query;
		req.search = parsedUrl.search;

		let i = 0,
			j = 0,
			callbackCountForRoute = foundRoutes[0].callbacks.length;
		req.params = foundRoutes[0].params;
		let loop: Function;
		const next: NextFunction = e => {
			if (e) {
				this._onError(e, req, res, next);
			} else {
				loop();
			}
		};

		try {
			loop = () => {
				if (!res.writableEnded) {
					if (j >= callbackCountForRoute) {
						if (++i >= routeCount) {
							return;
						}
						j = 0;
						req.params = foundRoutes[i].params;
						callbackCountForRoute = foundRoutes[i].callbacks.length;
					}
					foundRoutes[i].callbacks[j++](req, res, next);
				}
			};

			loop();
		} catch (e) {
			this._onError(e, req, res, next);
		}
	};
}
