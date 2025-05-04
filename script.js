const pastaTypes = {
	noodle: {
		src: "../assets/pasta/elbow.svg",
		threshold: 40,
		class: "noodle",
	},
	fusilli: {
		src: "../assets/pasta/fusilli.svg",
		threshold: 40,
		class: "long",
	},
	sauce: {
		threshold: 5,
		class: "sauce",
	},
	cheese: {
		src: "../assets/pasta/cheese.svg",
		threshold: 40,
		class: "cheese",
	},
};

/* Element data structure

{
  type: "image" | "sauce",
  x: number,
  y: number,
  angle?: number,  // for pasta
  src?: string,    // pasta only
  w?: number,
  h?: number
}

*/

let startX = -1,
	startY = -1;
let currentType = "noodle";
let drawMode = "brush";
let floatingPasta = null;
let angle = 0;

let drawHistory = [];
let redoStack = [];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageCache = {};

function preloadImages() {
	for (const key in pastaTypes) {
		const src = pastaTypes[key].src;
		if (src) {
			const img = new Image();
			img.src = src;
			imageCache[src] = img;
		}
	}
}

const backgroundImg = new Image();
backgroundImg.src = "./assets/crumpled-green-paper-texture.jpg";
backgroundImg.onload = () => {
	redraw(); // ensures background is drawn after it loads
	console.log("loaded");
};

preloadImages();

function getMouseCoords(e) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	};
}

function drawBackgroundCover(img, ctx, canvas) {
	const canvasAspect = canvas.width / canvas.height;
	const imgAspect = img.width / img.height;

	let sx, sy, sw, sh;

	if (imgAspect > canvasAspect) {
		// Image is wider than canvas
		sw = img.height * canvasAspect;
		sh = img.height;
		sx = (img.width - sw) / 2;
		sy = 0;
	} else {
		// Image is taller than canvas
		sw = img.width;
		sh = img.width / canvasAspect;
		sx = 0;
		sy = (img.height - sh) / 2;
	}

	ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
	if (backgroundImg.complete) {
		drawBackgroundCover(backgroundImg, ctx, canvas);
	} else {
		ctx.fillStyle = "#ffffff"; // fallback background
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	for (const action of drawHistory) {
		drawAction(action);
	}
}

function drawPreview() {
	if (!preview) return;
	drawAction(preview, 0.5); // optional: draw semi-transparent
}

function drawAction(action, alpha = 1) {
	ctx.save();
	ctx.globalAlpha = alpha;

	if (action.type === "image") {
		const img = imageCache[action.src];
		if (img && img.complete) {
			ctx.translate(action.x, action.y);
			ctx.rotate((action.angle * Math.PI) / 180);
			ctx.drawImage(
				img,
				-action.w / 2,
				-action.h / 2,
				action.w,
				action.h
			);
		}
	} else if (action.type === "sauce") {
		ctx.beginPath();
		ctx.arc(action.x, action.y, 25, 0, 2 * Math.PI);
		ctx.fillStyle = "#d63031";
		ctx.fill();
	}

	ctx.restore();
}

function toggleDrawMode() {
	drawMode = drawMode === "brush" ? "precision" : "brush";
	if (floatingPasta) {
		floatingPasta.remove();
		floatingPasta = null;
	}
}

function exportArt() {
	const link = document.createElement("a");
	link.download = "macaroni-art.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

function undo() {
	if (drawHistory.length > 0) {
		redoStack.push(drawHistory.pop());
		redraw();
	}
}

function redo() {
	if (redoStack.length > 0) {
		drawHistory.push(redoStack.pop());
		redraw();
	}
}

function startDraw(e) {
	e.preventDefault();
	if (drawMode === "brush") {
		const { x, y } = getCoords(e);
		startX = x;
		startY = y;
		isDrawing = true;
	}
}

function draw(e) {
	if (drawMode === "brush") {
		if (!isDrawing) return;
		e.preventDefault();

		const { x, y } = getCoords(e);
		const dist = getDistance(startX, startY, x, y);
		const typeData = pastaTypes[currentType];

		if (dist > typeData.threshold) {
			const angleDeg = getAngle(startX, startY, x, y) + 45;

			if (currentType === "sauce") {
				const dot = document.createElement("div");
				dot.classList.add(typeData.class);
				dot.style = `position: absolute; left: ${x - 25}px; top: ${
					y - 25
				}px;`;
				canvas.appendChild(dot);
				placedElements.push(dot);
			} else {
				const img = document.createElement("img");
				img.src = typeData.src;
				img.classList.add("pasta", typeData.class);
				img.style.left = `${startX - 15}px`;
				img.style.top = `${startY - 15}px`;
				// img.style.transform = `rotate(${angleDeg}deg)`;
				canvas.appendChild(img);
				placedElements.push(img);
			}

			document.getElementById("tutorial").style.display = "none";
			startX = x;
			startY = y;
		}
	} else if (drawMode === "precision") {
		const { x, y } = getCoords(e);
		if (!floatingPasta) {
			floatingPasta = document.createElement("img");
			floatingPasta.src = pastaTypes[currentType].src;
			floatingPasta.classList.add("pasta", pastaTypes[currentType].class);
			canvas.appendChild(floatingPasta);
		}
		floatingPasta.style.left = `${x}px`;
		floatingPasta.style.top = `${y}px`;
		floatingPasta.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
	}
}

function stopDraw() {
	if (drawMode === "brush") {
		isDrawing = false;
		startX = -1;
		startY = -1;
	}
}

// canvas.addEventListener("click", (e) => {
// 	if (drawMode === "precision" && floatingPasta) {
// 		const placed = floatingPasta.cloneNode();
// 		placed.style.pointerEvents = "none";
// 		canvas.appendChild(placed);
// 		placedElements.push(placed);
// 		document.getElementById("tutorial").style.display = "none";
// 	}
// });

window.addEventListener(
	"wheel",
	(e) => {
		if (drawMode === "precision") {
			e.preventDefault();
			angle += e.deltaY > 0 ? 5 : -5;
			if (floatingPasta) {
				floatingPasta.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
			}
		}
	},
	{ passive: false }
);

// ["mousedown", "touchstart"].forEach((evt) =>
// 	window.addEventListener(evt, startDraw)
// );
// ["mousemove", "touchmove"].forEach((evt) => window.addEventListener(evt, draw));
// ["mouseup", "touchend"].forEach((evt) =>
// 	window.addEventListener(evt, stopDraw)
// );

let isDrawing = false;
let lastX = 0,
	lastY = 0;

canvas.addEventListener("mousedown", (e) => {
	if (drawMode === "brush") {
		isDrawing = true;
		const { x, y } = getMouseCoords(e);
		lastX = x;
		lastY = y;
	}
});

canvas.addEventListener("mousemove", (e) => {
	if (!isDrawing || drawMode !== "brush") return;
	const { x, y } = getMouseCoords(e);
	const dx = x - lastX;
	const dy = y - lastY;
	const dist = Math.sqrt(dx * dx + dy * dy);

	const pasta = pastaTypes[currentType];
	if (dist > pasta.threshold) {
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		if (currentType === "sauce") {
			drawHistory.push({ type: "sauce", x, y });
		} else {
			drawHistory.push({
				type: "image",
				src: pasta.src,
				x,
				y,
				angle,
				w: 30,
				h: 30,
			});
		}

		lastX = x;
		lastY = y;
		redraw();
	}
});

canvas.addEventListener("mouseup", () => (isDrawing = false));

let preview = null;
let previewAngle = 0;

canvas.addEventListener("mousemove", (e) => {
	if (drawMode !== "precision") return;
	const { x, y } = getMouseCoords(e);

	preview = { x, y, angle: previewAngle, ...pastaTypes[currentType] };
	redraw();
	drawPreview();
});

canvas.addEventListener(
	"wheel",
	(e) => {
		if (drawMode === "precision") {
			e.preventDefault();
			previewAngle += e.deltaY > 0 ? 5 : -5;
			if (preview) {
				preview.angle = previewAngle;
				redraw();
				drawPreview();
			}
		}
	},
	{ passive: false }
);

canvas.addEventListener("click", (e) => {
	if (drawMode === "precision" && preview) {
		drawHistory.push({
			type: "image",
			src: preview.src,
			x: preview.x,
			y: preview.y,
			angle: preview.angle,
			w: 30,
			h: 30,
		});
		redraw();
	}
});

function resizeCanvasToWindow() {
	const canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	redraw(); // re-render the content after resize
}

window.addEventListener("resize", resizeCanvasToWindow);
resizeCanvasToWindow(); // set initial size

function getCoords(e) {
	if (e.type.startsWith("touch")) {
		return {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		};
	}
	return {
		x: e.clientX,
		y: e.clientY,
	};
}

function getDistance(x1, y1, x2, y2) {
	return Math.hypot(x2 - x1, y2 - y1);
}

function getAngle(x1, y1, x2, y2) {
	return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function changeTool(event, val) {
	event.preventDefault();
	document
		.querySelectorAll(".select")
		.forEach((el) => el.classList.remove("selected"));
	document.getElementById(val + "-but").classList.add("selected");
	currentType = val;
	if (floatingPasta) {
		floatingPasta.remove();
		floatingPasta = null;
	}
}
