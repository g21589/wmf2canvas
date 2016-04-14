"use strict";

var Buffer = require('buffer').Buffer;
var Icnov = require('iconv-lite');

var EMFConverter = function() {
	
	this.executeTime = 0;
	
};

EMFConverter.prototype.toCanvas = function(file, canvas, callback) {
	
	let reader = new FileReader();
	reader.onload = function (event) {
		let t = performance.now();
		try {
			parseEMF(new DataView(event.target.result), canvas);
		} catch (e) {
			console.error(e.message);
		}
		this.executeTime = performance.now() - t;
		if (typeof(callback) == "function") {
			callback(this);
		}
	};
	reader.onerror = function (event) {
		console.error(event);
	};
	reader.readAsArrayBuffer(file);
	
	function UserException(message) {
		this.message = message;
		this.name = "UserException";
	}
	
	function insertObjToFirstNull(arr, obj) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i] === null) {
				arr[i] = obj;
				break;
			}
		}
	}
	
	function drawBmpImage(ctx, base64ImgData, sx, sy, sw, sh, dx, dy, dw, dh, rop) {
		// TODO: Not implement rop
		let img = new Image();
		img.src = "data:image/bmp;base64," + base64ImgData;
		img.onload = function () {
			ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
		};
		img.onerror = function (stuff) {
			console.error("Img Onerror:", stuff);
		};
	}

	function drawPie(ctx, sxr, syr, exr, eyr, sxa, sya, exa, eya) {
		
		let rx = Math.abs(exr - sxr) / 2.0;
		let ry = Math.abs(eyr - syr) / 2.0;
		if (rx <= 0 || ry <= 0) {
			return;
		}

		let cx = Math.min(sxr, exr) + rx;
		let cy = Math.min(syr, eyr) + ry;
		
		ctx.beginPath();
		
		if (sxa == exa && sya == eya) {
			// Non-Rotate
			if (rx == ry) {			
				ctx.arc(cx, cy, rx, 0, 2 * Math.PI);
			} else {
				ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
			}
			
		} else {
			// Rotate
			let sa = Math.atan2((sya - cy) * rx, (sxa - cx) * ry);

			let sx = rx * Math.cos(sa);
			let sy = ry * Math.sin(sa);

			let ea = Math.atan2((eya - cy) * rx, (exa - cx) * ry);
			let ex = rx * Math.cos(ea);
			let ey = ry * Math.sin(ea);

			let a = Math.atan2((ex-sx) * (-sy) - (ey-sy) * (-sx), (ex-sx) * (-sx) + (ey-sy) * (-sy));
			
			ctx.ellipse(cx, cy, rx, ry, a, 0, 2 * Math.PI);
		}
		
		ctx.stroke();
		
	}

	function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke == 'undefined') {
			stroke = true;
		}
		if (typeof radius === 'undefined') {
			radius = 5;
		}
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
			for (var side in defaultRadius) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	}

	function Int32ToHexColor(color) {
		let blue = (color >> 16) & 0xFF;
		let green = (color >> 8) & 0xFF;
		let red = color & 0xFF;
		return sprintf("#%06X", (red << 16) | (green << 8) | blue );
	}

	function Uint8ArrayToBase64(dv) {
		let bs = "";
		for (let i=0; i<dv.byteLength; i++) {
			bs += String.fromCharCode(dv.getUint8(i));
		}
		return window.btoa(bs);
	}

	function dibToBmp(dib) {
		
		let length = dib.length;
				
		// dibToBmp
		let bmpData = new DataView(new ArrayBuffer(length + 14));
		
		/* BitmapFileHeader */
		bmpData.setUint8(0, 0x42);
		bmpData.setUint8(1, 0x4D);
		bmpData.setUint8(2,  length        & 0xff);
		bmpData.setUint8(3, (length >>  8) & 0xff);
		bmpData.setUint8(4, (length >> 16) & 0xff);
		bmpData.setUint8(5, (length >> 24) & 0xff);

		// reserved 1
		bmpData.setUint8(6, 0x00);
		bmpData.setUint8(7, 0x00);

		// reserved 2
		bmpData.setUint8(8, 0x00);
		bmpData.setUint8(9, 0x00);
		
		/* BitmapInfoHeader */
		let biSize = (dib[0] & 0xFF) + ((dib[1] & 0xFF) << 8)
					+ ((dib[2] & 0xFF) << 16) + ((dib[3] & 0xFF) << 24);
		// offset
		let bfOffBits = biSize + 14;

		let biBitCount = (dib[14] & 0xFF) + ((dib[15] & 0xFF) << 8);

		let clrUsed = (dib[32] & 0xFF) + ((dib[33] & 0xFF) << 8)
					+ ((dib[34] & 0xFF) << 16) + ((dib[35] & 0xFF) << 24);

		switch (biBitCount) {
		case 1:
			bfOffBits += (0x1 + 1) * 4;
			break;
		case 4:
			bfOffBits += (0xF + 1) * 4;
			break;
		case 8:
			bfOffBits += (0xFF + 1) * 4;
			break;
		case 16:
			bfOffBits += (clrUsed == 0) ? 0 : (0xFFFF + 1) * 4;
			break;
		case 24:
			bfOffBits += (clrUsed == 0) ? 0 : (0xFFFFFF + 1) * 4;
			break;
		case 32:
			bfOffBits += (clrUsed == 0) ? 0 : (0xFFFFFFFF + 1) * 4;
			break;
		}

		bmpData.setUint8(10,  bfOffBits        & 0xFF);
		bmpData.setUint8(11, (bfOffBits >>  8) & 0xFF);
		bmpData.setUint8(12, (bfOffBits >> 16) & 0xFF);
		bmpData.setUint8(13, (bfOffBits >> 24) & 0xFF);
		
		// Copy dib data
		for (let i = 0; i < length; i++) {
			bmpData.setUint8(14 + i, dib[i]);
		}
		
		return bmpData;
	}

	function getCharset(charset) {
		switch (charset) {
		case   0:	return "CP1252";
		case   2:	return "CP1252";
		case  77:	return "MacRoman";
		case 128:	return "CP932";
		case 129:	return "CP949";
		case 130:	return "Johab";
		case 134:	return "CP936";
		case 136:	return "big5";
		case 161:	return "CP1253";
		case 162:	return "CP1254";
		case 163:	return "CP1258";
		case 177:	return "CP1255";
		case 178:	return "CP1256";
		case 186:	return "CP1257";
		case 204:	return "CP1251";
		case 222:	return "CP874";
		case 238:	return "CP1250";
		case 255:	return "CP1252";
		default:	return "CP1252";
		}
	}
	
	function toAbsoluteX(x, ww, wx, mx, wox, wsx) {
		return ((ww >= 0) ? 1 : -1) * (mx * x - (wx + wox)) / wsx;
	}
	
	function toAbsoluteY(y, wh, wy, my, woy, wsy) {
		return ((wh >= 0) ? 1 : -1) * (my * y - (wy + woy)) / wsy;
	}
	
	function toRelativeX(x, ww, mx, wsx) {
		return ((ww >= 0) ? 1 : -1) * (mx * x) / wsx;
	}
	
	function toRelativeY(y, wh, my, wsy) {
		return ((wh >= 0) ? 1 : -1) * (my * y) / wsy;
	}
	
	function parseEMF(dv, canvas) {
		
		const EMR_HEADER                  = 0x00000001;
		const EMR_POLYBEZIER              = 0x00000002;
		const EMR_POLYGON                 = 0x00000003;
		const EMR_POLYLINE                = 0x00000004;
		const EMR_POLYBEZIERTO            = 0x00000005;
		const EMR_POLYLINETO              = 0x00000006;
		const EMR_POLYPOLYLINE            = 0x00000007;
		const EMR_POLYPOLYGON             = 0x00000008;
		const EMR_SETWINDOWEXTEX          = 0x00000009;
		const EMR_SETWINDOWORGEX          = 0x0000000A;
		const EMR_SETVIEWPORTEXTEX        = 0x0000000B;
		const EMR_SETVIEWPORTORGEX        = 0x0000000C;
		const EMR_SETBRUSHORGEX           = 0x0000000D;
		const EMR_EOF                     = 0x0000000E;
		const EMR_SETPIXELV               = 0x0000000F;
		const EMR_SETMAPPERFLAGS          = 0x00000010;
		const EMR_SETMAPMODE              = 0x00000011;
		const EMR_SETBKMODE               = 0x00000012;
		const EMR_SETPOLYFILLMODE         = 0x00000013;
		const EMR_SETROP2                 = 0x00000014;
		const EMR_SETSTRETCHBLTMODE       = 0x00000015;
		const EMR_SETTEXTALIGN            = 0x00000016;
		const EMR_SETCOLORADJUSTMENT      = 0x00000017;
		const EMR_SETTEXTCOLOR            = 0x00000018;
		const EMR_SETBKCOLOR              = 0x00000019;
		const EMR_OFFSETCLIPRGN           = 0x0000001A;
		const EMR_MOVETOEX                = 0x0000001B;
		const EMR_SETMETARGN              = 0x0000001C;
		const EMR_EXCLUDECLIPRECT         = 0x0000001D;
		const EMR_INTERSECTCLIPRECT       = 0x0000001E;
		const EMR_SCALEVIEWPORTEXTEX      = 0x0000001F;
		const EMR_SCALEWINDOWEXTEX        = 0x00000020;
		const EMR_SAVEDC                  = 0x00000021;
		const EMR_RESTOREDC               = 0x00000022;
		const EMR_SETWORLDTRANSFORM       = 0x00000023;
		const EMR_MODIFYWORLDTRANSFORM    = 0x00000024;
		const EMR_SELECTOBJECT            = 0x00000025;
		const EMR_CREATEPEN               = 0x00000026;
		const EMR_CREATEBRUSHINDIRECT     = 0x00000027;
		const EMR_DELETEOBJECT            = 0x00000028;
		const EMR_ANGLEARC                = 0x00000029;
		const EMR_ELLIPSE                 = 0x0000002A;
		const EMR_RECTANGLE               = 0x0000002B;
		const EMR_ROUNDRECT               = 0x0000002C;
		const EMR_ARC                     = 0x0000002D;
		const EMR_CHORD                   = 0x0000002E;
		const EMR_PIE                     = 0x0000002F;
		const EMR_SELECTPALETTE           = 0x00000030;
		const EMR_CREATEPALETTE           = 0x00000031;
		const EMR_SETPALETTEENTRIES       = 0x00000032;
		const EMR_RESIZEPALETTE           = 0x00000033;
		const EMR_REALIZEPALETTE          = 0x00000034;
		const EMR_EXTFLOODFILL            = 0x00000035;
		const EMR_LINETO                  = 0x00000036;
		const EMR_ARCTO                   = 0x00000037;
		const EMR_POLYDRAW                = 0x00000038;
		const EMR_SETARCDIRECTION         = 0x00000039;
		const EMR_SETMITERLIMIT           = 0x0000003A;
		const EMR_BEGINPATH               = 0x0000003B;
		const EMR_ENDPATH                 = 0x0000003C;
		const EMR_CLOSEFIGURE             = 0x0000003D;
		const EMR_FILLPATH                = 0x0000003E;
		const EMR_STROKEANDFILLPATH       = 0x0000003F;
		const EMR_STROKEPATH              = 0x00000040;
		const EMR_FLATTENPATH             = 0x00000041;
		const EMR_WIDENPATH               = 0x00000042;
		const EMR_SELECTCLIPPATH          = 0x00000043;
		const EMR_ABORTPATH               = 0x00000044;
		const EMR_COMMENT                 = 0x00000046;
		const EMR_FILLRGN                 = 0x00000047;
		const EMR_FRAMERGN                = 0x00000048;
		const EMR_INVERTRGN               = 0x00000049;
		const EMR_PAINTRGN                = 0x0000004A;
		const EMR_EXTSELECTCLIPRGN        = 0x0000004B;
		const EMR_BITBLT                  = 0x0000004C;
		const EMR_STRETCHBLT              = 0x0000004D;
		const EMR_MASKBLT                 = 0x0000004E;
		const EMR_PLGBLT                  = 0x0000004F;
		const EMR_SETDIBITSTODEVICE       = 0x00000050;
		const EMR_STRETCHDIBITS           = 0x00000051;
		const EMR_EXTCREATEFONTINDIRECTW  = 0x00000052;
		const EMR_EXTTEXTOUTA             = 0x00000053;
		const EMR_EXTTEXTOUTW             = 0x00000054;
		const EMR_POLYBEZIER16            = 0x00000055;
		const EMR_POLYGON16               = 0x00000056;
		const EMR_POLYLINE16              = 0x00000057;
		const EMR_POLYBEZIERTO16          = 0x00000058;
		const EMR_POLYLINETO16            = 0x00000059;
		const EMR_POLYPOLYLINE16          = 0x0000005A;
		const EMR_POLYPOLYGON16           = 0x0000005B;
		const EMR_POLYDRAW16              = 0x0000005C;
		const EMR_CREATEMONOBRUSH         = 0x0000005D;
		const EMR_CREATEDIBPATTERNBRUSHPT = 0x0000005E;
		const EMR_EXTCREATEPEN            = 0x0000005F;
		const EMR_POLYTEXTOUTA            = 0x00000060;
		const EMR_POLYTEXTOUTW            = 0x00000061;
		const EMR_SETICMMODE              = 0x00000062;
		const EMR_CREATECOLORSPACE        = 0x00000063;
		const EMR_SETCOLORSPACE           = 0x00000064;
		const EMR_DELETECOLORSPACE        = 0x00000065;
		const EMR_GLSRECORD               = 0x00000066;
		const EMR_GLSBOUNDEDRECORD        = 0x00000067;
		const EMR_PIXELFORMAT             = 0x00000068;
		const EMR_DRAWESCAPE              = 0x00000069;
		const EMR_EXTESCAPE               = 0x0000006A;
		const EMR_SMALLTEXTOUT            = 0x0000006C;
		const EMR_FORCEUFIMAPPING         = 0x0000006D;
		const EMR_NAMEDESCAPE             = 0x0000006E;
		const EMR_COLORCORRECTPALETTE     = 0x0000006F;
		const EMR_SETICMPROFILEA          = 0x00000070;
		const EMR_SETICMPROFILEW          = 0x00000071;
		const EMR_ALPHABLEND              = 0x00000072;
		const EMR_SETLAYOUT               = 0x00000073;
		const EMR_TRANSPARENTBLT          = 0x00000074;
		const EMR_GRADIENTFILL            = 0x00000076;
		const EMR_SETLINKEDUFIS           = 0x00000077;
		const EMR_SETTEXTJUSTIFICATION    = 0x00000078;
		const EMR_COLORMATCHTOTARGETW     = 0x00000079;
		const EMR_CREATECOLORSPACEW       = 0x0000007A;
		
		canvas.width = 480;
		canvas.height = 320;
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		let offset = 0, offset_bk = 0;
		
		// DC window
		let wx = 0, wy = 0, ww = 0, wh = 0;
		
		// DC window offset
		let wox = 0, woy = 0;
		
		// DC window scale
		let wsx = 1.0, wsy = 1.0;
		
		// DC mapping scale
		let mx = 1.0, my = 1.0;
		
		// Viewport
		let vx = 0, vy = 0, vw = 0, vh = 0;
		
		let charset = 0;
		let textColor = "#000";
		let fillMode = "evenodd";
		
		let HeaderType = dv.getUint32(offset, true); offset += 4;
		if (HeaderType != 0x00000001) {
			throw new UserException("Invalid EMF file format.");
		}
		
		let HeaderSize = dv.getUint32(offset, true); offset += 4;
		if (HeaderSize >= 108) {
			console.info("EmfMetafileHeaderExtension2");
			// EmfHeader (80 bytes)
			// EmfHeaderExtension1 (12 bytes)
			// EmfHeaderExtension2 (8 bytes)
			// EmfDescriptionBuffer (variable)
			// EmfDescription (variable)
		} else if (HeaderSize >= 100) {
			console.info("EmfMetafileHeaderExtension1");
		} else {
			console.info("EmfMetafileHeader");
		}
		
		// TODO
		offset += HeaderSize - 4;
		
		let objs = new Array(256);
		for (let i = 0; i < 256; i++) {
			objs[i] = null;
		}
		
		while (true) {
			
			offset_bk = offset;
			
			let type = dv.getUint32(offset, true); offset += 4;
			let size = dv.getUint32(offset, true); offset += 4;
			
			console.info(sprintf("Type: 0x%08X, Size: %d", type, size));
			
			if (type == EMR_EOF) {
				break;
			}
			
			switch (type) {
			case EMR_HEADER: {
				console.log("EMR_HEADER");
				break;
			}
			case EMR_POLYBEZIER: {
				console.log("EMR_POLYBEZIER");
				break;
			}
			case EMR_POLYGON: {
				console.log("EMR_POLYGON");
				break;
			}
			case EMR_POLYLINE: {
				console.log("EMR_POLYLINE");
				break;
			}
			case EMR_POLYBEZIERTO: {
				console.log("EMR_POLYBEZIERTO");
				break;
			}
			case EMR_POLYLINETO: {
				console.log("EMR_POLYLINETO");
				break;
			}
			case EMR_POLYPOLYLINE: {
				console.log("EMR_POLYPOLYLINE");
				break;
			}
			case EMR_POLYPOLYGON: {
				console.log("EMR_POLYPOLYGON");
				break;
			}
			case EMR_SETWINDOWEXTEX: {
				let height = dv.getInt32(offset, true); offset += 4;
				let width = dv.getInt32(offset, true); offset += 4;
				
				let inMemCanvas = document.createElement('canvas');
				let inMemCtx = inMemCanvas.getContext('2d');
				inMemCtx.drawImage(canvas, 0, 0);
				canvas.width = Math.abs(width);
				canvas.height = Math.abs(height);
				ctx.drawImage(inMemCanvas, 0, 0);
				
				ww = width;
				wh = height;
				console.log("EMR_SETWINDOWEXTEX (" + width + ", " + height + ")");
				break;
			}
			case EMR_SETWINDOWORGEX: {
				wy = dv.getInt32(offset, true); offset += 4;
				wx = dv.getInt32(offset, true); offset += 4;
				console.log("EMR_SETWINDOWORGEX (" + wx + ", " + wy + ")");
				break;
			}
			case EMR_SETVIEWPORTEXTEX: {
				let height = dv.getInt32(offset, true); offset += 4;
				let width = dv.getInt32(offset, true); offset += 4;
				vw = width;
				vh = height;
				console.log("EMR_SETVIEWPORTEXTEX (" + vw + ", " + vh + ")");
				break;
			}
			case EMR_SETVIEWPORTORGEX: {
				let y = dv.getInt32(offset, true); offset += 4;
				let x = dv.getInt32(offset, true); offset += 4;
				vx = x;
				vy = y;
				console.log("EMR_SETVIEWPORTORGEX (" + vx + ", " + vy + ")");
				break;
			}
			case EMR_SETBRUSHORGEX: {
				console.log("EMR_SETBRUSHORGEX");
				break;
			}
			case EMR_SETPIXELV: {
				console.log("EMR_SETPIXELV");
				break;
			}
			case EMR_SETMAPPERFLAGS: {
				console.log("EMR_SETMAPPERFLAGS");
				break;
			}
			case EMR_SETMAPMODE: {
				console.log("EMR_SETMAPMODE");
				break;
			}
			case EMR_SETBKMODE: {
				console.log("EMR_SETBKMODE");
				break;
			}
			case EMR_SETPOLYFILLMODE: {
				console.log("EMR_SETPOLYFILLMODE");
				break;
			}
			case EMR_SETROP2: {
				console.log("EMR_SETROP2");
				break;
			}
			case EMR_SETSTRETCHBLTMODE: {
				console.log("EMR_SETSTRETCHBLTMODE");
				break;
			}
			case EMR_SETTEXTALIGN: {
				console.log("EMR_SETTEXTALIGN");
				break;
			}
			case EMR_SETCOLORADJUSTMENT: {
				console.log("EMR_SETCOLORADJUSTMENT");
				break;
			}
			case EMR_SETTEXTCOLOR: {
				console.log("EMR_SETTEXTCOLOR");
				break;
			}
			case EMR_SETBKCOLOR: {
				console.log("EMR_SETBKCOLOR");
				break;
			}
			case EMR_OFFSETCLIPRGN: {
				console.log("EMR_OFFSETCLIPRGN");
				break;
			}
			case EMR_MOVETOEX: {
				console.log("EMR_MOVETOEX");
				break;
			}
			case EMR_SETMETARGN: {
				console.log("EMR_SETMETARGN");
				break;
			}
			case EMR_EXCLUDECLIPRECT: {
				console.log("EMR_EXCLUDECLIPRECT");
				break;
			}
			case EMR_INTERSECTCLIPRECT: {
				console.log("EMR_INTERSECTCLIPRECT");
				break;
			}
			case EMR_SCALEVIEWPORTEXTEX: {
				console.log("EMR_SCALEVIEWPORTEXTEX");
				break;
			}
			case EMR_SCALEWINDOWEXTEX: {
				console.log("EMR_SCALEWINDOWEXTEX");
				break;
			}
			case EMR_SAVEDC: {
				console.log("EMR_SAVEDC");
				break;
			}
			case EMR_RESTOREDC: {
				console.log("EMR_RESTOREDC");
				break;
			}
			case EMR_SETWORLDTRANSFORM: {
				console.log("EMR_SETWORLDTRANSFORM");
				break;
			}
			case EMR_MODIFYWORLDTRANSFORM: {
				console.log("EMR_MODIFYWORLDTRANSFORM");
				break;
			}
			case EMR_SELECTOBJECT: {
				console.log("EMR_SELECTOBJECT");
				break;
			}
			case EMR_CREATEPEN: {
				let ihPen = dv.getUint32(offset, true); offset += 4;
				let style = dv.getUint32(offset, true); offset += 4;
				let width = dv.getInt32(offset, true); offset += 4;
				dv.getInt32(offset, true); offset += 4;
				let color = Int32ToHexColor(dv.getInt32(offset, true)); offset += 4;
				
				insertObjToFirstNull(objs, {
					"type"  : "PEN",
					"style" : style,
					"color" : color,
					"width" : width
				});
				console.log("EMR_CREATEPEN");
				break;
			}
			case EMR_CREATEBRUSHINDIRECT: {
				console.log("EMR_CREATEBRUSHINDIRECT");
				break;
			}
			case EMR_DELETEOBJECT: {
				console.log("EMR_DELETEOBJECT");
				break;
			}
			case EMR_ANGLEARC: {
				console.log("EMR_ANGLEARC");
				break;
			}
			case EMR_ELLIPSE: {
				console.log("EMR_ELLIPSE");
				break;
			}
			case EMR_RECTANGLE: {
				console.log("EMR_RECTANGLE");
				break;
			}
			case EMR_ROUNDRECT: {
				console.log("EMR_ROUNDRECT");
				break;
			}
			case EMR_ARC: {
				console.log("EMR_ARC");
				break;
			}
			case EMR_CHORD: {
				console.log("EMR_CHORD");
				break;
			}
			case EMR_PIE: {
				console.log("EMR_PIE");
				break;
			}
			case EMR_SELECTPALETTE: {
				console.log("EMR_SELECTPALETTE");
				break;
			}
			case EMR_CREATEPALETTE: {
				console.log("EMR_CREATEPALETTE");
				break;
			}
			case EMR_SETPALETTEENTRIES: {
				console.log("EMR_SETPALETTEENTRIES");
				break;
			}
			case EMR_RESIZEPALETTE: {
				console.log("EMR_RESIZEPALETTE");
				break;
			}
			case EMR_REALIZEPALETTE: {
				console.log("EMR_REALIZEPALETTE");
				break;
			}
			case EMR_EXTFLOODFILL: {
				console.log("EMR_EXTFLOODFILL");
				break;
			}
			case EMR_LINETO: {
				console.log("EMR_LINETO");
				break;
			}
			case EMR_ARCTO: {
				console.log("EMR_ARCTO");
				break;
			}
			case EMR_POLYDRAW: {
				console.log("EMR_POLYDRAW");
				break;
			}
			case EMR_SETARCDIRECTION: {
				console.log("EMR_SETARCDIRECTION");
				break;
			}
			case EMR_SETMITERLIMIT: {
				console.log("EMR_SETMITERLIMIT");
				break;
			}
			case EMR_BEGINPATH: {
				console.log("EMR_BEGINPATH");
				break;
			}
			case EMR_ENDPATH: {
				console.log("EMR_ENDPATH");
				break;
			}
			case EMR_CLOSEFIGURE: {
				console.log("EMR_CLOSEFIGURE");
				break;
			}
			case EMR_FILLPATH: {
				console.log("EMR_FILLPATH");
				break;
			}
			case EMR_STROKEANDFILLPATH: {
				console.log("EMR_STROKEANDFILLPATH");
				break;
			}
			case EMR_STROKEPATH: {
				console.log("EMR_STROKEPATH");
				break;
			}
			case EMR_FLATTENPATH: {
				console.log("EMR_FLATTENPATH");
				break;
			}
			case EMR_WIDENPATH: {
				console.log("EMR_WIDENPATH");
				break;
			}
			case EMR_SELECTCLIPPATH: {
				console.log("EMR_SELECTCLIPPATH");
				break;
			}
			case EMR_ABORTPATH: {
				console.log("EMR_ABORTPATH");
				break;
			}
			case EMR_COMMENT: {
				console.log("EMR_COMMENT");
				break;
			}
			case EMR_FILLRGN: {
				console.log("EMR_FILLRGN");
				break;
			}
			case EMR_FRAMERGN: {
				console.log("EMR_FRAMERGN");
				break;
			}
			case EMR_INVERTRGN: {
				console.log("EMR_INVERTRGN");
				break;
			}
			case EMR_PAINTRGN: {
				console.log("EMR_PAINTRGN");
				break;
			}
			case EMR_EXTSELECTCLIPRGN: {
				console.log("EMR_EXTSELECTCLIPRGN");
				break;
			}
			case EMR_BITBLT: {
				console.log("EMR_BITBLT");
				break;
			}
			case EMR_STRETCHBLT: {
				console.log("EMR_STRETCHBLT");
				break;
			}
			case EMR_MASKBLT: {
				console.log("EMR_MASKBLT");
				break;
			}
			case EMR_PLGBLT: {
				console.log("EMR_PLGBLT");
				break;
			}
			case EMR_SETDIBITSTODEVICE: {
				console.log("EMR_SETDIBITSTODEVICE");
				break;
			}
			case EMR_STRETCHDIBITS: {
				console.log("EMR_STRETCHDIBITS");
				break;
			}
			case EMR_EXTCREATEFONTINDIRECTW: {
				console.log("EMR_EXTCREATEFONTINDIRECTW");
				break;
			}
			case EMR_EXTTEXTOUTA: {
				console.log("EMR_EXTTEXTOUTA");
				break;
			}
			case EMR_EXTTEXTOUTW: {
				console.log("EMR_EXTTEXTOUTW");
				break;
			}
			case EMR_POLYBEZIER16: {
				console.log("EMR_POLYBEZIER16");
				break;
			}
			case EMR_POLYGON16: {
				console.log("EMR_POLYGON16");
				break;
			}
			case EMR_POLYLINE16: {
				console.log("EMR_POLYLINE16");
				break;
			}
			case EMR_POLYBEZIERTO16: {
				console.log("EMR_POLYBEZIERTO16");
				break;
			}
			case EMR_POLYLINETO16: {
				console.log("EMR_POLYLINETO16");
				break;
			}
			case EMR_POLYPOLYLINE16: {
				console.log("EMR_POLYPOLYLINE16");
				break;
			}
			case EMR_POLYPOLYGON16: {
				offset += 16;	// Bounds (16 bytes)
				let NumberOfPolygons = dv.getUint32(offset, true); offset += 4;
				let Count = dv.getUint32(offset, true); offset += 4;
				let PolygonPointCount = new Array(NumberOfPolygons);
				for (let i = 0; i < NumberOfPolygons; i++) {
					PolygonPointCount[i] = dv.getUint32(offset, true); offset += 4;
				}
				for (let i = 0; i < NumberOfPolygons; i++) {
					ctx.beginPath();
					let x = toAbsoluteX(dv.getInt16(offset, true), ww, wx, mx, wox, wsx); offset += 2;
					let y = toAbsoluteY(dv.getInt16(offset, true), wh, wy, my, woy, wsy); offset += 2;
					ctx.moveTo(x, y);
					
					for (let j = 1; j < PolygonPointCount[i]; j++) {
						x = toAbsoluteX(dv.getInt16(offset, true), ww, wx, mx, wox, wsx); offset += 2;
						y = toAbsoluteY(dv.getInt16(offset, true), wh, wy, my, woy, wsy); offset += 2;
						ctx.lineTo(x, y);
					}
					
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
				}
				console.log("EMR_POLYPOLYGON16");
				break;
			}
			case EMR_POLYDRAW16: {
				console.log("EMR_POLYDRAW16");
				break;
			}
			case EMR_CREATEMONOBRUSH: {
				console.log("EMR_CREATEMONOBRUSH");
				break;
			}
			case EMR_CREATEDIBPATTERNBRUSHPT: {
				console.log("EMR_CREATEDIBPATTERNBRUSHPT");
				break;
			}
			case EMR_EXTCREATEPEN: {
				console.log("EMR_EXTCREATEPEN");
				break;
			}
			case EMR_POLYTEXTOUTA: {
				console.log("EMR_POLYTEXTOUTA");
				break;
			}
			case EMR_POLYTEXTOUTW: {
				console.log("EMR_POLYTEXTOUTW");
				break;
			}
			case EMR_SETICMMODE: {
				console.log("EMR_SETICMMODE");
				break;
			}
			case EMR_CREATECOLORSPACE: {
				console.log("EMR_CREATECOLORSPACE");
				break;
			}
			case EMR_SETCOLORSPACE: {
				console.log("EMR_SETCOLORSPACE");
				break;
			}
			case EMR_DELETECOLORSPACE: {
				console.log("EMR_DELETECOLORSPACE");
				break;
			}
			case EMR_GLSRECORD: {
				console.log("EMR_GLSRECORD");
				break;
			}
			case EMR_GLSBOUNDEDRECORD: {
				console.log("EMR_GLSBOUNDEDRECORD");
				break;
			}
			case EMR_PIXELFORMAT: {
				console.log("EMR_PIXELFORMAT");
				break;
			}
			case EMR_DRAWESCAPE: {
				console.log("EMR_DRAWESCAPE");
				break;
			}
			case EMR_EXTESCAPE: {
				console.log("EMR_EXTESCAPE");
				break;
			}
			case EMR_SMALLTEXTOUT: {
				console.log("EMR_SMALLTEXTOUT");
				break;
			}
			case EMR_FORCEUFIMAPPING: {
				console.log("EMR_FORCEUFIMAPPING");
				break;
			}
			case EMR_NAMEDESCAPE: {
				console.log("EMR_NAMEDESCAPE");
				break;
			}
			case EMR_COLORCORRECTPALETTE: {
				console.log("EMR_COLORCORRECTPALETTE");
				break;
			}
			case EMR_SETICMPROFILEA: {
				console.log("EMR_SETICMPROFILEA");
				break;
			}
			case EMR_SETICMPROFILEW: {
				console.log("EMR_SETICMPROFILEW");
				break;
			}
			case EMR_ALPHABLEND: {
				console.log("EMR_ALPHABLEND");
				break;
			}
			case EMR_SETLAYOUT: {
				console.log("EMR_SETLAYOUT");
				break;
			}
			case EMR_TRANSPARENTBLT: {
				console.log("EMR_TRANSPARENTBLT");
				break;
			}
			case EMR_GRADIENTFILL: {
				console.log("EMR_GRADIENTFILL");
				break;
			}
			case EMR_SETLINKEDUFIS: {
				console.log("EMR_SETLINKEDUFIS");
				break;
			}
			case EMR_SETTEXTJUSTIFICATION: {
				console.log("EMR_SETTEXTJUSTIFICATION");
				break;
			}
			case EMR_COLORMATCHTOTARGETW: {
				console.log("EMR_COLORMATCHTOTARGETW");
				break;
			}
			case EMR_CREATECOLORSPACEW: {
				console.log("EMR_CREATECOLORSPACEW");
				break;
			}
			default: {
				console.warn("unsuppored id find: " + id + " (size=" + size + ")");
			}
			}
			
			offset = offset_bk + size;
			
		}
		
	}
	
};

EMFConverter.prototype.toPng = function(file) {
	// TODO
};

EMFConverter.prototype.toSvg = function(file) {
	// TODO
};

EMFConverter.prototype.getExeTime = function() {
	return this.executeTime;
};
