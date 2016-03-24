function UserException(message) {
	this.message = message;
	this.name = "UserException";
}

/* -------------------------------------------------------
 * GDI物件主要有五種 用來改變繪圖時的設定 分別是
 * CPen:    用來設定繪圖時所用的 筆觸設定(線)
 * CBrush:  用來設定繪圖時所用的 筆刷設定(範圍)
 * CFont:   用來設定畫字時的     字型設定
 * CRgn:    用來改變繪圖時的     遮罩 被遮罩的地方將不會被畫到
 * CBitmap: 用來設定這個device context的  繪圖暫存區
 * -------------------------------------------------------- */
function parseWMF(dv, canvas) {
	
	const RECORD_EOF 						= 0x0000;
	const RECORD_REALIZE_PALETTE 			= 0x0035;
	const RECORD_SET_PALETTE_ENTRIES 		= 0x0037;
	const RECORD_SET_BK_MODE 				= 0x0102;
	const RECORD_SET_MAP_MODE 				= 0x0103;
	const RECORD_SET_ROP2 					= 0x0104;
	const RECORD_SET_REL_ABS 				= 0x0105;
	const RECORD_SET_POLY_FILL_MODE 		= 0x0106;
	const RECORD_SET_STRETCH_BLT_MODE 		= 0x0107;
	const RECORD_SET_TEXT_CHARACTER_EXTRA 	= 0x0108;
	const RECORD_RESTORE_DC 				= 0x0127;
	const RECORD_RESIZE_PALETTE 			= 0x0139;
	const RECORD_DIB_CREATE_PATTERN_BRUSH 	= 0x0142;
	const RECORD_SET_LAYOUT 				= 0x0149;
	const RECORD_SET_BK_COLOR 				= 0x0201;
	const RECORD_SET_TEXT_COLOR 			= 0x0209;
	const RECORD_OFFSET_VIEWPORT_ORG_EX 	= 0x0211;
	const RECORD_LINE_TO 					= 0x0213;
	const RECORD_MOVE_TO_EX 				= 0x0214;
	const RECORD_OFFSET_CLIP_RGN 			= 0x0220;
	const RECORD_FILL_RGN 					= 0x0228;
	const RECORD_SET_MAPPER_FLAGS 			= 0x0231;
	const RECORD_SELECT_PALETTE 			= 0x0234;
	const RECORD_POLYGON 					= 0x0324;
	const RECORD_POLYLINE 					= 0x0325;
	const RECORD_SET_TEXT_JUSTIFICATION 	= 0x020A;
	const RECORD_SET_WINDOW_ORG_EX 			= 0x020B;
	const RECORD_SET_WINDOW_EXT_EX 			= 0x020C;
	const RECORD_SET_VIEWPORT_ORG_EX 		= 0x020D;
	const RECORD_SET_VIEWPORT_EXT_EX 		= 0x020E;
	const RECORD_OFFSET_WINDOW_ORG_EX 		= 0x020F;
	const RECORD_SCALE_WINDOW_EXT_EX 		= 0x0410;
	const RECORD_SCALE_VIEWPORT_EXT_EX 		= 0x0412;
	const RECORD_EXCLUDE_CLIP_RECT 			= 0x0415;
	const RECORD_INTERSECT_CLIP_RECT 		= 0x0416;
	const RECORD_ELLIPSE 					= 0x0418;
	const RECORD_FLOOD_FILL 				= 0x0419;
	const RECORD_FRAME_RGN 					= 0x0429;
	const RECORD_ANIMATE_PALETTE 			= 0x0436;
	const RECORD_TEXT_OUT 					= 0x0521;
	const RECORD_POLY_POLYGON 				= 0x0538;
	const RECORD_EXT_FLOOD_FILL 			= 0x0548;
	const RECORD_RECTANGLE 					= 0x041B;
	const RECORD_SET_PIXEL 					= 0x041F;
	const RECORD_ROUND_RECT 				= 0x061C;
	const RECORD_PAT_BLT 					= 0x061D;
	const RECORD_SAVE_DC 					= 0x001E;
	const RECORD_PIE 						= 0x081A;
	const RECORD_STRETCH_BLT 				= 0x0B23;
	const RECORD_ESCAPE 					= 0x0626;
	const RECORD_INVERT_RGN 				= 0x012A;
	const RECORD_PAINT_RGN 					= 0x012B;
	const RECORD_SELECT_CLIP_RGN 			= 0x012C;
	const RECORD_SELECT_OBJECT 				= 0x012D;
	const RECORD_SET_TEXT_ALIGN 			= 0x012E;
	const RECORD_ARC 						= 0x0817;
	const RECORD_CHORD 						= 0x0830;
	const RECORD_BIT_BLT 					= 0x0922;
	const RECORD_EXT_TEXT_OUT 				= 0x0a32;
	const RECORD_SET_DIBITS_TO_DEVICE 		= 0x0d33;
	const RECORD_DIB_BIT_BLT 				= 0x0940;
	const RECORD_DIB_STRETCH_BLT 			= 0x0b41;
	const RECORD_STRETCH_DIBITS 			= 0x0f43;
	const RECORD_DELETE_OBJECT 				= 0x01f0;
	const RECORD_CREATE_PALETTE 			= 0x00f7;
	const RECORD_CREATE_PATTERN_BRUSH 		= 0x01F9;
	const RECORD_CREATE_PEN_INDIRECT 		= 0x02FA;
	const RECORD_CREATE_FONT_INDIRECT 		= 0x02FB;
	const RECORD_CREATE_BRUSH_INDIRECT 		= 0x02FC;
	const RECORD_CREATE_RECT_RGN 			= 0x06FF;
	
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	let offset = 0, offset_bk = 0;			
	let mtType = 0, mtHeaderSize = 0;
	
	let key = dv.getUint32(offset, true); offset += 4;
	if (key == 0x9AC6CDD7) {
		let hmf = dv.getInt16(offset, true); offset += 2;
		let vsx = dv.getInt16(offset, true); offset += 2;
		let vsy = dv.getInt16(offset, true); offset += 2;
		let vex = dv.getInt16(offset, true); offset += 2;
		let vey = dv.getInt16(offset, true); offset += 2;
		let dpi = dv.getUint16(offset, true); offset += 2;
		let reserved = dv.getUint32(offset, true); offset += 4;
		let checksum = dv.getUint16(offset, true); offset += 2;

		//gdi.placeableHeader(vsx, vsy, vex, vey, dpi);

		mtType = dv.getUint16(offset, true); offset += 2;
		mtHeaderSize = dv.getUint16(offset, true); offset += 2;
	} else {
		mtType = (key & 0x0000FFFF);
		mtHeaderSize = ((key & 0xFFFF0000) >> 16);
	}
	
	let mtVersion = dv.getUint16(offset, true); offset += 2;
	let mtSize = dv.getUint32(offset, true); offset += 4;
	let mtNoObjects = dv.getUint16(offset, true); offset += 2;
	let mtMaxRecord = dv.getUint32(offset, true); offset += 4;
	let mtNoParameters = dv.getUint16(offset, true); offset += 2;
	
	if (mtType != 1 || mtHeaderSize != 9) {
		throw new UserException("Invalid file format.");
	}
	
	while (true) {
		
		let size = dv.getUint32(offset, true) - 3; offset += 4;
		let id = dv.getUint16(offset, true); offset += 2;
		
		console.info("id: " + id.toString(16) + ", size: " + size);
		
		if (id == RECORD_EOF) {
			break; // Last record
		}
		
		offset_bk = offset;
		
		switch (id) {
		case RECORD_REALIZE_PALETTE: {
			//gdi.realizePalette();
			console.log("REALIZE_PALETTE");
			break;
		}
		case RECORD_SET_PALETTE_ENTRIES: {
			var entries = new Array[dv.getUint16(offset, true)]; offset += 2;
			let startIndex = dv.getUint16(offset, true); offset += 2;
			let objID = dv.getUint16(offset, true); offset += 2;
			for (let i = 0; i < entries.length; i++) {
				entries[i] = dv.getInt32(offset, true); offset += 4;
			}
			//gdi.setPaletteEntries((//gdiPalette) objs[objID], startIndex, entries);
			console.log("SET_PALETTE_ENTRIES");
			break;
		}
		case RECORD_SET_BK_MODE: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setBkMode(mode);
			console.log("SET_SET_BK_MODE");
			break;
		}
		case RECORD_SET_MAP_MODE: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setMapMode(mode);
			console.log("SET_MAP_MODE");
			break;
		}
		case RECORD_SET_ROP2: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setROP2(mode);
			console.log("SET_ROP2");
			break;
		}
		case RECORD_SET_REL_ABS: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setRelAbs(mode);
			console.log("SET_REL_ABS");
			break;
		}
		case RECORD_SET_POLY_FILL_MODE: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setPolyFillMode(mode);
			console.log("SET_POLY_FILL_MODE");
			break;
		}
		case RECORD_SET_STRETCH_BLT_MODE: {
			let mode = dv.getInt16(offset, true); offset += 2;
			//gdi.setStretchBltMode(mode);
			console.log("SET_STRETCH_BLT_MODE");
			break;
		}
		case RECORD_SET_TEXT_CHARACTER_EXTRA: {
			let extra = dv.getInt16(offset, true); offset += 2;
			//gdi.setTextCharacterExtra(extra);
			console.log("SET_TEXT_CHARACTER_EXTRA");
			break;
		}
		case RECORD_RESTORE_DC: {
			let dc = dv.getInt16(offset, true); offset += 2;
			//gdi.restoreDC(dc);
			console.log("RESTORE_DC");
			break;
		}
		case RECORD_RESIZE_PALETTE: {
			let objID = dv.getUint16(offset, true); offset += 2;;
			//gdi.resizePalette((//gdiPalette) objs[objID]);
			console.log("RESIZE_PALETTE");
			break;
		}
		case RECORD_DIB_CREATE_PATTERN_BRUSH: {
			let usage = dv.getInt32(offset, true); offset += 4;
			// TODO
			/*
			byte[] image = in.readBytes(size * 2 - in.getCount());

			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.dibCreatePatternBrush(image, usage);
					break;
				}
			}
			*/
			console.log("DIB_CREATE_PATTERN_BRUSH");
			break;
		}
		case RECORD_SET_LAYOUT: {
			let layout = dv.getUint32(offset, true); offset += 4;
			//gdi.setLayout(layout);
			console.log("SET_LAYOUT");
			break;
		}
		case RECORD_SET_BK_COLOR: {
			let color = dv.getInt32(offset, true); offset += 4;
			//gdi.setBkColor(color);
			console.log("SET_BK_COLOR");
			break;
		}
		case RECORD_SET_TEXT_COLOR: {
			let color = dv.getInt32(offset, true); offset += 4;
			//gdi.setTextColor(color);
			console.log("SET_TEXT_COLOR");
			ctx.fillStyle = sprintf("#%06X", color);
			break;
		}
		case RECORD_OFFSET_VIEWPORT_ORG_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.offsetViewportOrgEx(x, y, null);
			console.log("OFFSET_VIEWPORT_ORG_EX");
			break;
		}
		case RECORD_LINE_TO: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			//gdi.lineTo(ex, ey);
			console.log("LineTo (" + ex + ", " + ey + ")");
			ctx.lineTo(ex, ey);
			ctx.stroke();
			break;
		}
		case RECORD_MOVE_TO_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.moveToEx(x, y, null);
			console.log("MoveTo (" + x + ", " + y + ")");
			ctx.beginPath();
			ctx.moveTo(x, y);
			break;
		}
		case RECORD_OFFSET_CLIP_RGN: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.offsetClipRgn(x, y);
			console.log("OFFSET_CLIP_RGN");
			break;
		}
		case RECORD_FILL_RGN: {
			let brushID = dv.getUint16(offset, true); offset += 2;
			let rgnID = dv.getUint16(offset, true); offset += 2;
			//gdi.fillRgn((//gdiRegion) objs[rgnID], (//gdiBrush) objs[brushID]);
			console.log("OFFSET_FILL_RGN");
			break;
		}
		case RECORD_SET_MAPPER_FLAGS: {
			let flag = dv.getUint32(offset, true); offset += 4;
			//gdi.setMapperFlags(flag);
			console.log("SET_MAPPER_FLAGS");
			break;
		}
		case RECORD_SELECT_PALETTE: {
			let mode = (dv.getInt16(offset, true) != 0); offset += 2;
			//if ((size * 2 - in.getCount()) > 0) {
				//let objID = dv.getUint16(offset, true); offset += 2;;
				//gdi.selectPalette((//gdiPalette) objs[objID], mode);
			//}
			console.log("SELECT_PALETTE");
			break;
		}
		case RECORD_POLYGON: {
			/*
			Point[] points = new Point[dv.getInt16(offset, true)]; offset += 2;
			for (let i = 0; i < points.length; i++) {
				points[i] = new Point(dv.getInt16(offset, true), dv.getInt16(offset, true));
				offset += 4;
			}
			*/
			//gdi.polygon(points);
			console.log("POLYGON");
			break;
		}
		case RECORD_POLYLINE: {
			/*
			Point[] points = new Point[dv.getInt16(offset, true)]; offset += 2;
			for (let i = 0; i < points.length; i++) {
				points[i] = new Point(dv.getInt16(offset, true), dv.getInt16(offset, true));
				offset += 4;
			}
			*/
			//gdi.polyline(points);
			console.log("POLYLINE");
			break;
		}
		case RECORD_SET_TEXT_JUSTIFICATION: {
			let breakCount = dv.getInt16(offset, true); offset += 2;
			let breakExtra = dv.getInt16(offset, true); offset += 2;
			//gdi.setTextJustification(breakExtra, breakCount);
			console.log("SET_TEXT_JUSTIFICATION");
			break;
		}
		case RECORD_SET_WINDOW_ORG_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.setWindowOrgEx(x, y, null);
			console.log("SET_WINDOW_ORG_EX (" + x + ", " + y + ")");
			break;
		}
		case RECORD_SET_WINDOW_EXT_EX: {
			let height = dv.getInt16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			//gdi.setWindowExtEx(width, height, null);
			console.log("SET_WINDOW_EXT_EX (" + width + ", " + height + ")");
			canvas.width = width;
			canvas.height = height;
			break;
		}
		case RECORD_SET_VIEWPORT_ORG_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.setViewportOrgEx(x, y, null);
			console.log("SET_VIEWPORT_ORG_EX (" + x + ", " + y + ")");
			break;
		}
		case RECORD_SET_VIEWPORT_EXT_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.setViewportExtEx(x, y, null);
			console.log("SET_VIEWPORT_EXT_EX (" + x + ", " + y + ")");
			break;
		}
		case RECORD_OFFSET_WINDOW_ORG_EX: {
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.offsetWindowOrgEx(x, y, null);
			console.log("OFFSET_WINDOW_ORG_EX (" + x + ", " + y + ")");
			break;
		}
		case RECORD_SCALE_WINDOW_EXT_EX: {
			let yd = dv.getInt16(offset, true); offset += 2;
			let y = dv.getInt16(offset, true); offset += 2;
			let xd = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.scaleWindowExtEx(x, xd, y, yd, null);
			console.log("SCALE_WINDOW_EXT_EX (" + x + ", " + y + ") (" + xd + ", " + yd + ")");
			break;
		}
		case RECORD_SCALE_VIEWPORT_EXT_EX: {
			let yd = dv.getInt16(offset, true); offset += 2;
			let y = dv.getInt16(offset, true); offset += 2;
			let xd = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.scaleViewportExtEx(x, xd, y, yd, null);
			console.log("SCALE_VIEWPORT_EXT_EX (" + x + ", " + y + ") (" + xd + ", " + yd + ")");
			break;
		}
		case RECORD_EXCLUDE_CLIP_RECT: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.excludeClipRect(sx, sy, ex, ey);
			break;
		}
		case RECORD_INTERSECT_CLIP_RECT: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.intersectClipRect(sx, sy, ex, ey);
			break;
		}
		case RECORD_ELLIPSE: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.ellipse(sx, sy, ex, ey);
			break;
		}
		case RECORD_FLOOD_FILL: {
			let color = dv.getInt32(offset, true); offset += 4;
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.floodFill(x, y, color);
			break;
		}
		case RECORD_FRAME_RGN: {
			let height = dv.getInt16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			let brushID = dv.getUint16(offset, true); offset += 2;
			let rgnID = dv.getUint16(offset, true); offset += 2;
			//gdi.frameRgn((//gdiRegion) objs[rgnID], (//gdiBrush) objs[brushID], width, height);
			break;
		}
		case RECORD_ANIMATE_PALETTE: {
			var entries = new Array(dv.getUint16(offset, true)); offset += 2;
			let startIndex = dv.getUint16(offset, true); offset += 2;
			let objID = dv.getUint16(offset, true); offset += 2;
			for (let i = 0; i < entries.length; i++) {
				entries[i] = dv.getInt32(offset, true); offset += 4;
			}
			//gdi.animatePalette((//gdiPalette) objs[objID], startIndex, entries);
			break;
		}
		case RECORD_TEXT_OUT: {
			// TODO
			/*
			let count = dv.getInt16(offset, true); offset += 2;
			byte[] text = in.readBytes(count);
			if (count % 2 == 1) {
				in.readByte();
			}
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.textOut(x, y, text);
			*/
			break;
		}
		case RECORD_POLY_POLYGON: {
			// TODO
			/*
			Point[][] points = new Point[in.readInt16()][];
			for (let i = 0; i < points.length; i++) {
				points[i] = new Point[in.readInt16()];
			}
			for (let i = 0; i < points.length; i++) {
				for (let j = 0; j < points[i].length; j++) {
					points[i][j] = new Point(in.readInt16(), in.readInt16());
				}
			}
			*/
			//gdi.polyPolygon(points);
			break;
		}
		case RECORD_EXT_FLOOD_FILL: {
			let type = dv.getUint16(offset, true); offset += 2;;
			let color = dv.getInt32(offset, true); offset += 4;
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.extFloodFill(x, y, color, type);
			break;
		}
		case RECORD_RECTANGLE: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.rectangle(sx, sy, ex, ey);
			break;
		}
		case RECORD_SET_PIXEL: {
			let color = dv.getInt32(offset, true); offset += 4;
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.setPixel(x, y, color);
			break;
		}
		case RECORD_ROUND_RECT: {
			let rh = dv.getInt16(offset, true); offset += 2;
			let rw = dv.getInt16(offset, true); offset += 2;
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.roundRect(sx, sy, ex, ey, rw, rh);
			break;
		}
		case RECORD_PAT_BLT: {
			let rop = dv.getUint32(offset, true); offset += 4;
			let height = dv.getInt16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			//gdi.patBlt(x, y, width, height, rop);
			break;
		}
		case RECORD_SAVE_DC: {
			//gdi.seveDC();
			console.log("SAVE_DC");
			break;
		}
		case RECORD_PIE: {
			let eyr = dv.getInt16(offset, true); offset += 2;
			let exr = dv.getInt16(offset, true); offset += 2;
			let syr = dv.getInt16(offset, true); offset += 2;
			let sxr = dv.getInt16(offset, true); offset += 2;
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			//gdi.pie(sx, sy, ex, ey, sxr, syr, exr, eyr);
			break;
		}
		case RECORD_STRETCH_BLT: {
			let rop = dv.getUint32(offset, true); offset += 4;
			let sh = dv.getInt16(offset, true); offset += 2;
			let sw = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let dh = dv.getInt16(offset, true); offset += 2;
			let dw = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;
			
			// TODO
			//byte[] image = in.readBytes(size * 2 - in.getCount());

			//gdi.stretchBlt(image, dx, dy, dw, dh, sx, sy, sw, sh, rop);
			break;
		}
		case RECORD_ESCAPE: {
			// TODO
			//byte[] data = in.readBytes(2 * size);
			//gdi.escape(data);
			console.log("ESCAPE");
			break;
		}
		case RECORD_INVERT_RGN: {
			let rgnID = dv.getUint16(offset, true); offset += 2;
			//gdi.invertRgn((//gdiRegion) objs[rgnID]);
			console.log("INVERT_RGN");
			break;
		}
		case RECORD_PAINT_RGN: {
			let objID = dv.getUint16(offset, true); offset += 2;
			//gdi.paintRgn((//gdiRegion) objs[objID]);
			console.log("PAINT_RGN");
			break;
		}
		case RECORD_SELECT_CLIP_RGN: {
			let objID = dv.getUint16(offset, true); offset += 2;
			//gdiRegion rgn = (objID > 0) ? (//gdiRegion) objs[objID] : null;
			//gdi.selectClipRgn(rgn);
			console.log("SELECT_CLIP_RGN");
			break;
		}
		case RECORD_SELECT_OBJECT: {
			let objID = dv.getUint16(offset, true); offset += 2;
			//gdi.selectObject(objs[objID]);
			console.log("SELECT_OBJECT " + objID);
			break;
		}
		case RECORD_SET_TEXT_ALIGN: {
			let align = dv.getInt16(offset, true); offset += 2;
			//gdi.setTextAlign(align);
			console.log("SET_TEXT_ALIGN " + align);
			break;
		}
		case RECORD_ARC: {
			let eya = dv.getInt16(offset, true); offset += 2;
			let exa = dv.getInt16(offset, true); offset += 2;
			let sya = dv.getInt16(offset, true); offset += 2;
			let sxa = dv.getInt16(offset, true); offset += 2;
			let eyr = dv.getInt16(offset, true); offset += 2;
			let exr = dv.getInt16(offset, true); offset += 2;
			let syr = dv.getInt16(offset, true); offset += 2;
			let sxr = dv.getInt16(offset, true); offset += 2;
			//gdi.arc(sxr, syr, exr, eyr, sxa, sya, exa, eya);
			break;
		}
		case RECORD_CHORD: {
			let eya = dv.getInt16(offset, true); offset += 2;
			let exa = dv.getInt16(offset, true); offset += 2;
			let sya = dv.getInt16(offset, true); offset += 2;
			let sxa = dv.getInt16(offset, true); offset += 2;
			let eyr = dv.getInt16(offset, true); offset += 2;
			let exr = dv.getInt16(offset, true); offset += 2;
			let syr = dv.getInt16(offset, true); offset += 2;
			let sxr = dv.getInt16(offset, true); offset += 2;
			//gdi.chord(sxr, syr, exr, eyr, sxa, sya, exa, eya);
			break;
		}
		case RECORD_BIT_BLT: {
			let rop = dv.getUint32(offset, true); offset += 4;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let height = dv.getInt16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;

			// TODO
			//byte[] image = in.readBytes(size * 2 - in.getCount());

			//gdi.bitBlt(image, dx, dy, width, height, sx, sy, rop);
			break;
		}
		case RECORD_EXT_TEXT_OUT: {
			// TODO
			let rsize = size;

			let y = dv.getInt16(offset, true); offset += 2;
			let x = dv.getInt16(offset, true); offset += 2;
			let count = dv.getInt16(offset, true); offset += 2;
			let options = dv.getUint16(offset, true); offset += 2;;
			rsize -= 4;
			
			let rect = null;
			if ((options & 0x0006) > 0) {
				rect = new Array(4);
				rect[0] = dv.getInt16(offset, true); offset += 2;
				rect[1] = dv.getInt16(offset, true); offset += 2;
				rect[2] = dv.getInt16(offset, true); offset += 2;
				rect[3] = dv.getInt16(offset, true); offset += 2;
				rsize -= 4;
			}
			
			let text = "";
			for (let i = 0; i < count; i++) {
				text += String.fromCharCode(dv.getInt8(offset++, true));
			}
			if (count % 2 == 1) {
				dv.getInt8(offset++, true);
			}
			rsize -= (count + 1) / 2;
			
			let dx = null;
			if (rsize > 0) {
				dx = new Array(rsize);
				for (let i = 0; i < rsize; i++) {
					dx[i] = dv.getInt16(offset, true);
					offset += 2;
				}
			}
			
			//gdi.extTextOut(x, y, options, rect, text, dx);
			console.log("fillText " + JSON.stringify({x, y, count, text}));
			// TODO
			ctx.font = "190pt Times";
			ctx.fillText(text, x, y);
			break;
		}
		case RECORD_SET_DIBITS_TO_DEVICE: {
			let colorUse = dv.getUint16(offset, true); offset += 2;;
			let scanlines = dv.getUint16(offset, true); offset += 2;;
			let startscan = dv.getUint16(offset, true); offset += 2;;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let dh = dv.getInt16(offset, true); offset += 2;
			let dw = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;

			// TODO
			//byte[] image = in.readBytes(size * 2 - in.getCount());

			//gdi.setDIBitsToDevice(dx, dy, dw, dh, sx, sy, startscan, scanlines, image, colorUse);
			break;
		}
		case RECORD_DIB_BIT_BLT: {
			// TODO
			/*
			let isRop = false;

			let rop = dv.getUint32(offset, true); offset += 4;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let height = dv.getInt16(offset, true); offset += 2;
			if (height == 0) {
				height = dv.getInt16(offset, true); offset += 2;
				isRop = true;
			}
			let width = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;

			if (isRop) {
				//gdi.dibBitBlt(null, dx, dy, width, height, sx, sy, rop);
			} else {
				byte[] image = in.readBytes(size * 2 - in.getCount());

				//gdi.dibBitBlt(image, dx, dy, width, height, sx, sy, rop);
			}
			*/
			break;
		}
		case RECORD_DIB_STRETCH_BLT: {
			let rop = dv.getUint32(offset, true); offset += 4;
			let sh = dv.getInt16(offset, true); offset += 2;
			let sw = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let dh = dv.getInt16(offset, true); offset += 2;
			let dw = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;

			// TODO
			//byte[] image = in.readBytes(size * 2 - in.getCount());

			//gdi.dibStretchBlt(image, dx, dy, dw, dh, sx, sy, sw, sh, rop);
			console.log("DIB_STRETCH_BLT " + JSON.stringify({dx, dy, dw, dh, sx, sy, sw, sh, rop}));
			break;
		}
		case RECORD_STRETCH_DIBITS: {
			let rop = dv.getUint32(offset, true); offset += 4;
			let usage = dv.getUint16(offset, true); offset += 2;;
			let sh = dv.getInt16(offset, true); offset += 2;
			let sw = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			let dh = dv.getInt16(offset, true); offset += 2;
			let dw = dv.getInt16(offset, true); offset += 2;
			let dy = dv.getInt16(offset, true); offset += 2;
			let dx = dv.getInt16(offset, true); offset += 2;

			// TODO
			//byte[] image = in.readBytes(size * 2 - in.getCount());

			//gdi.stretchDIBits(dx, dy, dw, dh, sx, sy, sw, sh, image, usage, rop);
			console.log("STRETCH_DIBITS " + JSON.stringify({dx, dy, dw, dh, sx, sy, sw, sh, usage, rop}));
			break;
		}
		case RECORD_DELETE_OBJECT: {
			let objID = dv.getUint16(offset, true); offset += 2;;
			//gdi.deleteObject(objs[objID]);
			//objs[objID] = null;
			console.log("DELETE_OBJECT " + objID);
			break;
		}
		case RECORD_CREATE_PALETTE: {
			// TODO
			/*
			let version = dv.getUint16(offset, true); offset += 2;;
			int[] entries = new int[dv.getUint16(offset, true); offset += 2;];
			for (let i = 0; i < entries.length; i++) {
				entries[i] = dv.getInt32(offset, true); offset += 4;
			}

			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.createPalette(version, entries);
					break;
				}
			}
			*/
			console.log("CREATE_PALETTE");
			break;
		}
		case RECORD_CREATE_PATTERN_BRUSH: {
			// TODO
			/*
			byte[] image = in.readBytes(size * 2 - in.getCount());

			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.createPatternBrush(image);
					break;
				}
			}
			*/
			console.log("CREATE_PATTERN_BRUSH");
			break;
		}
		case RECORD_CREATE_PEN_INDIRECT: {
			let style = dv.getUint16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			dv.getInt16(offset, true); offset += 2;
			let color = dv.getInt32(offset, true); offset += 4;
			/*
			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.createPenIndirect(style, width, color);
					break;
				}
			}
			*/
			console.log("CREATE_PEN_INDIRECT");
			ctx.lineWidth = width;
			ctx.strokeStyle = sprintf("#%06X", color);
			break;
		}
		case RECORD_CREATE_FONT_INDIRECT: {
			let height = dv.getInt16(offset, true); offset += 2;
			let width = dv.getInt16(offset, true); offset += 2;
			let escapement = dv.getInt16(offset, true); offset += 2;
			let orientation = dv.getInt16(offset, true); offset += 2;
			let weight = dv.getInt16(offset, true); offset += 2;
			let italic = (dv.getInt8(offset, true) == 1); offset++;
			let underline = (dv.getInt8(offset, true) == 1); offset++;
			let strikeout = (dv.getInt8(offset, true) == 1); offset++;
			let charset = dv.getInt8(offset, true); offset++;
			let outPrecision = dv.getInt8(offset, true); offset++;
			let clipPrecision = dv.getInt8(offset, true); offset++;
			let quality = dv.getInt8(offset, true); offset++;
			let pitchAndFamily = dv.getInt8(offset, true); offset++;
			//byte[] faceName = in.readBytes(size * 2 - in.getCount());

			//gdiObject obj = //gdi.createFontIndirect(height, width, escapement, orientation, weight, italic,
			// 				underline, strikeout, charset, outPrecision, clipPrecision, quality, pitchAndFamily,
			// 				faceName);
			
			/*
			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = obj;
					break;
				}
			}
			*/
			console.log("CREATE_FONT_INDIRECT");
			break;
		}
		case RECORD_CREATE_BRUSH_INDIRECT: {
			let style = dv.getUint16(offset, true); offset += 2;
			let color = dv.getInt32(offset, true); offset += 4;
			let hatch = dv.getUint16(offset, true); offset += 2;
			/*
			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.createBrushIndirect(style, color, hatch);
					break;
				}
			}
			*/
			console.log("CREATE_BRUSH_INDIRECT");
			break;
		}
		case RECORD_CREATE_RECT_RGN: {
			let ey = dv.getInt16(offset, true); offset += 2;
			let ex = dv.getInt16(offset, true); offset += 2;
			let sy = dv.getInt16(offset, true); offset += 2;
			let sx = dv.getInt16(offset, true); offset += 2;
			/*
			for (let i = 0; i < objs.length; i++) {
				if (objs[i] == null) {
					objs[i] = //gdi.createRectRgn(sx, sy, ex, ey);
					break;
				}
			}
			*/
			console.log("CREATE_RECT_RGN");
			break;
		}
		default: {
			console.warn("unsuppored id find: " + id + " (size=" + size + ")");
		}
		}
		
		offset = offset_bk + size * 2;
		
	}
}
