wmf2canvas
==========
[![MIT License][license-image]][license-url]

Convert WMF (Windows Metafile) image file to HTML5 canvas

Online Demo
----
comming soon


Usage
----
```html
<input type="file" id="file" accept="image/x-wmf" />
<canvas id="canvas"></canvas>

<script>
let wmf = new WMFConverter();   // new the WMFConverter object
	
let canvas = document.getElementById("canvas");
let file = document.getElementById("file");
	
file.onchange = function() {
	let filename = this.files[0];
	wmf.toCanvas(filename, canvas); // load the wmf file and convert to canvas graph
}
</script>
```

Version
----

Bets test


License
----

MIT

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
