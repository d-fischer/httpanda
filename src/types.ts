import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { ParsedUrl } from './parseUrl';

export interface Request extends IncomingMessage, ParsedUrl {
	params: Record<string, string>;
	path: string;
	query: string | null;
	search: string | null;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	/** @private */ _parseUrlCache?: ParsedUrl;
}

export type Response = ServerResponse;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorType = any;
export type NextFunction = (e?: ErrorType) => void;
export type ErrorHandler = (e: ErrorType, req: Request, res: Response, next: NextFunction) => void;

export interface HttpServerOptions {
	server?: HttpServer;
	onError?: ErrorHandler;
}

export type RouteCallback = (req: Request, res: Response, next: NextFunction) => void;
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
