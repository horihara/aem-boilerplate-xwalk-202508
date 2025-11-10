export default function decorate(block) {
  // 既存 HTML をクリア
  block.innerHTML = "";

  // dataset に値が無ければ、子 <p> から fallback
  const getDatasetValue = (name, defaultValue = 0) => {
    if (block.dataset[name]) return block.dataset[name];
    const indexMap = {
      areaX: 2,
      areaY: 3,
      areaWidth: 4,
      areaHeight: 5,
      areaHref: 6,
      alt: 1,
      image: 0
    };
    const idx = indexMap[name];
    const p = block.querySelector(`div:nth-child(${idx + 1}) p`);
    return p ? p.textContent : defaultValue;
  };

  // container
  const container = document.createElement("div");
  container.classList.add("image-map-container");
  container.style.position = "relative";

  // 画像
  const img = document.createElement("img");
  img.src = getDatasetValue("image", "");
  img.alt = getDatasetValue("alt", "");
  container.appendChild(img);

  // クリックエリア
  const link = document.createElement("a");
  link.classList.add("clickable-area");
  link.target = "_blank";
  container.appendChild(link);

  block.appendChild(container);

  // 更新関数
  function updateArea() {
    const x = parseFloat(block.dataset.areaX || getDatasetValue("areaX") || 0);
    const y = parseFloat(block.dataset.areaY || getDatasetValue("areaY") || 0);
    const w = parseFloat(block.dataset.areaWidth || getDatasetValue("areaWidth") || 0);
    const h = parseFloat(block.dataset.areaHeight || getDatasetValue("areaHeight") || 0);
    const href = block.dataset.areaHref || getDatasetValue("areaHref") || "#";

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

  // 初期描画
  updateArea();

  // Universal Editor 上で変更されたときに即反映
  const observer = new MutationObserver(updateArea);
  observer.observe(block, {
    attributes: true,
    attributeFilter: [
      "data-image", "data-alt",
      "data-area-x", "data-area-y", "data-area-width", "data-area-height", "data-area-href"
    ]
  });
}