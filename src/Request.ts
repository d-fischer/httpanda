import { IncomingMessage } from 'http';
import { ParsedUrl } from './parseUrl';

export interface Request extends IncomingMessage, ParsedUrl {
	params: Record<string, string>;
	path: string;
	query: string | null;
	search: string | null;
}
