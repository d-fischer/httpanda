import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { ParsedUrl } from './parseUrl';

export interface Request extends IncomingMessage {
	params: Record<string, string>;
	param: Record<string, string>;
	path: string;
	query: Record<string, string | string[]>;
	search: string | null;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	/** @private */ _parseUrlCache?: ParsedUrl;
}

export type Response = ServerResponse;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorType = any;
export type NextFunction = (e?: ErrorType) => void;

export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;
export type ErrorHandler = (e: ErrorType, req: Request, res: Response, next: NextFunction) => void;

export interface HttpServerOptions {
	server?: HttpServer;
	onError?: ErrorHandler;
}

export type HttpMethod = 'HEAD' | 'OPTIONS' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'TRACE';

export interface RouteLayer {
	regex: RegExp;
	method?: HttpMethod;
	paramNames: string[];
	callbacks: RequestHandler[];
}

export interface FoundCallback {
	params: Record<string, string>;
	callback: RequestHandler;
}
