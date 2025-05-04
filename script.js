const pastaTypes = {
	noodle: {
		src: "https://cdn.glitch.com/26c9b2a0-25e1-4ee0-b069-12e7269a1009%2Fmacaroni4.svg?1554246493313",
		threshold: 40,
		class: "noodle",
	},
	fusilli: {
		src: "https://cdn.glitch.com/26c9b2a0-25e1-4ee0-b069-12e7269a1009%2Ffusilli5.svg?1554246450461",
		threshold: 40,
		class: "long",
	},
	sauce: {
		threshold: 5,
		class: "sauce",
	},
	cheese: {
		src: "https://cdn.glitch.com/26c9b2a0-25e1-4ee0-b069-12e7269a1009%2Fshredded2.svg?1554428627200",
		threshold: 40,
		class: "cheese",
	},
};

let startX = -1,
	startY = -1,
	isDrawing = false;
let currentType = "noodle";
let drawMode = "brush";
let floatingPasta = null;
let angle = 0;
let placedElements = [];
let redoStack = [];
const canvas = document.getElementById("canvas");

function toggleDrawMode() {
	drawMode = drawMode === "brush" ? "precision" : "brush";
	if (floatingPasta) {
		floatingPasta.remove();
		floatingPasta = null;
	}
}

const captureScreen = async () => {
	const screenshotBtn = document.querySelector("#src-btn");
	try {
		const stream = await navigator.mediaDevices.getDisplayMedia({
			preferCurrentTab: true,
		});
		const video = document.createElement("video");

		video.addEventListener("loadedmetadata", () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			video.play();

			// Small delay to ensure frame is ready
			setTimeout(() => {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				stream.getVideoTracks()[0].stop();

				// Download canvas as PNG
				const link = document.createElement("a");
				link.download = "macaroni-art-screenshot.png";
				link.href = canvas.toDataURL("image/png");
				link.click();
			}, 100); // wait a bit after play() to ensure the frame is ready
		});

		video.srcObject = stream;
	} catch (error) {
		alert("Failed to capture screenshot!");
		console.error(error);
	}
};

function exportArtre() {
	const canvasEl = document.getElementById("canvas");

	// Force layout reflow (sometimes helps for async images)
	canvasEl.offsetHeight;

	html2canvas(canvasEl, {
		backgroundColor: null,
		useCORS: true,
		allowTaint: true,
		logging: true,
		width: canvasEl.offsetWidth,
		height: canvasEl.offsetHeight,
		scrollY: -window.scrollY,
	}).then((canvas) => {
		const link = document.createElement("a");
		link.download = "macaroni-art.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	});
}

function undo() {
	const el = placedElements.pop();
	if (el) {
		el.remove();
		redoStack.push(el);
	}
}

function redo() {
	const el = redoStack.pop();
	if (el) {
		canvas.appendChild(el);
		placedElements.push(el);
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
				img.crossOrigin = "anonymous";
				img.src = typeData.src;
				img.classList.add("pasta", typeData.class);
				img.style.left = `${startX}px`;
				img.style.top = `${startY}px`;
				img.style.transform += `rotate(${angleDeg}deg)`;
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
			floatingPasta.crossOrigin = "anonymous";
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

canvas.addEventListener("click", (e) => {
	if (drawMode === "precision" && floatingPasta) {
		const placed = floatingPasta.cloneNode();
		placed.style.pointerEvents = "none";
		canvas.appendChild(placed);
		placedElements.push(placed);
		document.getElementById("tutorial").style.display = "none";
	}
});

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

["mousedown", "touchstart"].forEach((evt) =>
	window.addEventListener(evt, startDraw)
);
["mousemove", "touchmove"].forEach((evt) => window.addEventListener(evt, draw));
["mouseup", "touchend"].forEach((evt) =>
	window.addEventListener(evt, stopDraw)
);

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
