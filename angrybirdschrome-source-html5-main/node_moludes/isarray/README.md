
# isarray

`Array#isArray` for older browsers.

[![build status](https://secure.travis-ci.org/juliangruber/isarray.svg)](https://travis-ci.org/juliangruber/isarray)
[![downloads](https://img.shields.io/npm/dm/isarray.svg)](https://www.npmjs.org/package/isarray)

[![browser support](https://ci.testling.com/juliangruber/isarray.png)
](https://ci.testling.com/juliangruber/isarray)

## Usage

```js
var isArray = require('isarray');

console.log(isArray([])); // => true
console.log(isArray({})); // => false
```

## Installation

With [npm](https://npmjs.org) do

```bash
$ npm install isarray
```

Then bundle for the browser with
[browserify](https://github.com/substack/browserify).

With [component](https://component.io) do

```bash
$ component install juliangruber/isarray
```

## License

(MIT)

Copyright (c) 2013 Julian Gruber &lt;julian@juliangruber.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
