/* eslint-disable @typescript-eslint/naming-convention */
import { Request } from './types';

export interface ParsedUrl {
	href: string;
	path: string;
	pathname: string;
	query: Record<string, string | string[]>;
	search: string | null;
	/** @private */ _full: String;
}

export function parseQueryString(str: string) {
	const result = {};

	for (const part of str.split('&')) {
		const eqPos = part.indexOf('=');
		let key = '',
			value = part;
		if (eqPos !== -1) {
			key = part.substr(0, eqPos);
			value = part.substr(eqPos + 1);
		}
		result[key] = Object.prototype.hasOwnProperty.call(result, key)
			? Array.isArray(result[key])
				? [...result[key], value]
				: [result[key], value]
			: value;
	}

	return result;
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
			query: {},
			_full: url
		});
	}

	const search = url.substr(searchStart);
	return (req._parseUrlCache = {
		href: url,
		path: url,
		pathname: url.substr(0, searchStart),
		search,
		query: parseQueryString(search.substr(1)),
		_full: url
	});
}
