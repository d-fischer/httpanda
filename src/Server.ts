import { createServer, Server as HttpServer, STATUS_CODES } from 'http';
import { ListenOptions } from 'net';
import { parseUrl } from './parseUrl';
import { Router } from './Router';
import { ErrorHandler, HttpMethod, HttpServerOptions, NextFunction, Request, Response, RequestHandler } from './types';
import { dropComponents } from './dropComponents';

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
	private readonly _on404: RequestHandler;

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

	async close() {
		return new Promise((resolve, reject) => {
			if (!this._httpServer) {
				reject('Server not open when trying to close');
				return;
			}
			this._httpServer.close(e => {
				if (e) {
					reject(e);
				} else {
					resolve();
				}
			});
		});
	}

	use(...fns: RequestHandler[]): this;
	use(path: string, ...fns: RequestHandler[]): this;
	use(pathOrFn: RequestHandler | string, ...fns: RequestHandler[]): this {
		const path = (typeof pathOrFn === 'string' && pathOrFn) || '/';
		const callbacks = typeof pathOrFn === 'string' ? fns : [pathOrFn, ...fns];

		return super.use(path, ...callbacks);
	}

	handleRequest = (req: Request, res: Response): void => {
		const parsedUrl = parseUrl(req);
		const foundRoutes = this.find(req.method! as HttpMethod, parsedUrl.pathname);
		foundRoutes.push({
			callback: this._on404,
			params: {},
			componentsToDrop: 0
		});
		const routeCount = foundRoutes.length;
		req.path = parsedUrl.pathname;
		req.query = parsedUrl.query;
		req.search = parsedUrl.search;

		let i = 0;
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
					if (i >= routeCount) {
						return;
					}
					const foundRoute = foundRoutes[i++];
					req.path = dropComponents(parsedUrl.pathname, foundRoute.componentsToDrop);
					req.param = req.params = { ...req.params, ...foundRoute.params };
					const callback = foundRoute.callback;
					callback(req, res, next);
				}
			};

			loop();
		} catch (e) {
			this._onError(e, req, res, next);
		}
	};
}
