/* eslint-disable @typescript-eslint/naming-convention */
import { Request } from './types';

export interface ParsedUrl {
	href: string;
	path: string;
	pathname: string;
	query: string | null;
	search: string | null;
	/** @private */ _full: String;
}

export function parseUrl(req: Request): ParsedUrl {
	let url = req.url;
	if (url === undefined) {
		url = '/';
	}

	if (req._parseUrlCache?._full === url) {
		return req._parseUrlCache;
	}

	const searchStart = url.indexOf('?');
	if (searchStart === -1) {
		return (req._parseUrlCache = {
			href: url,
			path: url,
			pathname: url,
			search: null,
			query: null,
			_full: url
		});
	}

	const search = url.substr(searchStart);
	return (req._parseUrlCache = {
		href: url,
		path: url,
		pathname: url.substr(0, searchStart),
		search,
		query: search.substr(1),
		_full: url
	});
}
