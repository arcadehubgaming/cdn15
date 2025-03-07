declare namespace normalizeUrl {
	interface Options {
		/**
		@default 'http:'
		*/
		readonly defaultProtocol?: string;

		/**
		Prepends `defaultProtocol` to the URL if it's protocol-relative.

		@default true

		@example
		```
		normalizeUrl('//sindresorhus.com:80/');
		//=> 'https://sindresorhus.com'

		normalizeUrl('//sindresorhus.com:80/', {normalizeProtocol: false});
		//=> '//sindresorhus.com'
		```
		*/
		readonly normalizeProtocol?: boolean;

		/**
		Normalizes `https:` URLs to `http:`.

		@default false

		@example
		```
		normalizeUrl('https://sindresorhus.com:80/');
		//=> 'https://sindresorhus.com'

		normalizeUrl('https://sindresorhus.com:80/', {forceHttp: true});
		//=> 'https://sindresorhus.com'
		```
		*/
		readonly forceHttp?: boolean;

		/**
		Normalizes `http:` URLs to `https:`.

		This option can't be used with the `forceHttp` option at the same time.

		@default false

		@example
		```
		normalizeUrl('https://sindresorhus.com:80/');
		//=> 'https://sindresorhus.com'

		normalizeUrl('https://sindresorhus.com:80/', {forceHttps: true});
		//=> 'https://sindresorhus.com'
		```
		*/
		readonly forceHttps?: boolean;

		/**
		Strip the [authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) part of a URL.

		@default true

		@example
		```
		normalizeUrl('user:password@sindresorhus.com');
		//=> 'https://sindresorhus.com'

		normalizeUrl('user:password@sindresorhus.com', {stripAuthentication: false});
		//=> 'https://user:password@sindresorhus.com'
		```
		*/
		readonly stripAuthentication?: boolean;

		/**
		Removes hash from the URL.

		@default false

		@example
		```
		normalizeUrl('sindresorhus.com/about.html#contact');
		//=> 'https://sindresorhus.com/about.html#contact'

		normalizeUrl('sindresorhus.com/about.html#contact', {stripHash: true});
		//=> 'https://sindresorhus.com/about.html'
		```
		*/
		readonly stripHash?: boolean;

		/**
		Removes HTTP(S) protocol from an URL `https://sindresorhus.com` → `sindresorhus.com`.

		@default false

		@example
		```
		normalizeUrl('https://sindresorhus.com');
		//=> 'https://sindresorhus.com'

		normalizeUrl('sindresorhus.com', {stripProtocol: true});
		//=> 'sindresorhus.com'
		```
		*/
		readonly stripProtocol?: boolean;

		/**
		Removes `www.` from the URL.

		@default true

		@example
		```
		normalizeUrl('https://www.sindresorhus.com');
		//=> 'https://sindresorhus.com'

		normalizeUrl('https://www.sindresorhus.com', {stripWWW: false});
		//=> 'https://www.sindresorhus.com'
		```
		*/
		readonly stripWWW?: boolean;

		/**
		Removes query parameters that matches any of the provided strings or regexes.

		@default [/^utm_\w+/i]

		@example
		```
		normalizeUrl('www.sindresorhus.com?foo=bar&ref=test_ref', {
			removeQueryParameters: ['ref']
		});
		//=> 'https://sindresorhus.com/?foo=bar'
		```
		*/
		readonly removeQueryParameters?: ReadonlyArray<RegExp | string>;

		/**
		Removes trailing slash.

		__Note__: Trailing slash is always removed if the URL doesn't have a pathname.

		@default true

		@example
		```
		normalizeUrl('https://sindresorhus.com/redirect/');
		//=> 'https://sindresorhus.com/redirect'

		normalizeUrl('https://sindresorhus.com/redirect/', {removeTrailingSlash: false});
		//=> 'https://sindresorhus.com/redirect/'

		normalizeUrl('https://sindresorhus.com/', {removeTrailingSlash: false});
		//=> 'https://sindresorhus.com'
		```
		*/
		readonly removeTrailingSlash?: boolean;

		/**
		Removes the default directory index file from path that matches any of the provided strings or regexes.
		When `true`, the regex `/^index\.[a-z]+$/` is used.

		@default false

		@example
		```
		normalizeUrl('www.sindresorhus.com/foo/default.php', {
			removeDirectoryIndex: [/^default\.[a-z]+$/]
		});
		//=> 'https://sindresorhus.com/foo'
		```
		*/
		readonly removeDirectoryIndex?: ReadonlyArray<RegExp | string>;

		/**
		Sorts the query parameters alphabetically by key.

		@default true

		@example
		```
		normalizeUrl('www.sindresorhus.com?b=two&a=one&c=three', {
			sortQueryParameters: false
		});
		//=> 'https://sindresorhus.com/?b=two&a=one&c=three'
		```
		*/
		readonly sortQueryParameters?: boolean;
	}
}

declare const normalizeUrl: {
	/**
	[Normalize](https://en.wikipedia.org/wiki/URL_normalization) a URL.

	@param url - URL to normalize, including [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

	@example
	```
	import normalizeUrl = require('normalize-url');

	normalizeUrl('sindresorhus.com');
	//=> 'https://sindresorhus.com'

	normalizeUrl('https://xn--xample-hva.com:80/?b=bar&a=foo');
	//=> 'https://êxample.com/?a=foo&b=bar'
	```
	*/
	(url: string, options?: normalizeUrl.Options): string;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function normalizeUrl(url: string, options?: normalizeUrl.Options): string;
	// export = normalizeUrl;
	default: typeof normalizeUrl;
};

export = normalizeUrl;
