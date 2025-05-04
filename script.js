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
const canvas = document.getElementById("canvas");

["mousedown", "touchstart"].forEach((evt) =>
	window.addEventListener(evt, startDraw)
);
["mousemove", "touchmove"].forEach((evt) => window.addEventListener(evt, draw));
["mouseup", "touchend"].forEach((evt) =>
	window.addEventListener(evt, stopDraw)
);

function startDraw(e) {
	e.preventDefault();
	const { x, y } = getCoords(e);
	startX = x;
	startY = y;
	isDrawing = true;
}

function draw(e) {
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
		} else {
			console.log(angleDeg);

			const img = document.createElement("img");

			img.src = typeData.src;
			img.classList.add("pasta", typeData.class);
			img.style.left = `${startX}px`;
			img.style.top = `${startY}px`;
			img.style.transform += `rotate(${angleDeg}deg)`;
			canvas.appendChild(img);
		}

		document.getElementById("tutorial").style.display = "none";
		startX = x;
		startY = y;
	}
}

function stopDraw() {
	isDrawing = false;
	startX = -1;
	startY = -1;
}

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
}
