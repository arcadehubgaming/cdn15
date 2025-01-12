# prepend-http [![Build Status](https://travis-ci.org/sindresorhus/prepend-http.svg?branch=master)](https://travis-ci.org/sindresorhus/prepend-http)

> Prepend `https://` to humanized URLs like `todomvc.com` and `localhost`


## Install

```
$ npm install prepend-http
```


## Usage

```js
const prependHttp = require('prepend-http');

prependHttp('todomvc.com');
//=> 'https://todomvc.com'

prependHttp('localhost');
//=> 'https://localhost'

prependHttp('https://todomvc.com');
//=> 'https://todomvc.com'

prependHttp('todomvc.com', {https: true});
//=> 'https://todomvc.com'
```


## API

### prependHttp(url, [options])

#### url

Type: `string`

URL to prepend `https://` on.

#### options

Type: `Object`

##### https

Type: `boolean`<br>
Default: `false`

Prepend `https://` instead of `https://`.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
