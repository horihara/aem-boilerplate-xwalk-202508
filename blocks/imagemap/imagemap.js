export default function decorate(block) {
  const container = document.createElement("div");
  container.classList.add("imagemap-container");
  container.style.position = "relative";

  const img = document.createElement("img");
  img.src = block.dataset.image;
  img.alt = block.dataset.alt || "";
  container.appendChild(img);

  const link = document.createElement("a");
  link.classList.add("clickable-area");
  link.target = "_blank";
  container.appendChild(link);

  block.innerHTML = "";
  block.appendChild(container);

  function updateArea() {
    const x = parseFloat(block.dataset.areaX) || 0;
    const y = parseFloat(block.dataset.areaY) || 0;
    const w = parseFloat(block.dataset.areaWidth) || 0;
    const h = parseFloat(block.dataset.areaHeight) || 0;
    const href = block.dataset.areaHref || "#";

    link.href = href;
    Object.assign(link.style, {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      border: "2px dashed rgba(255,0,0,0.4)",
      cursor: "pointer"
    });
  }

  updateArea();

  const observer = new MutationObserver(updateArea);
  observer.observe(block, { attributes: true, attributeFilter: [
    "data-image", "data-alt",
    "data-area-x", "data-area-y", "data-area-width", "data-area-height", "data-area-href"
  ]});
}