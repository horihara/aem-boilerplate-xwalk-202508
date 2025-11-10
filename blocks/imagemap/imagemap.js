// /blocks/imagemap/imagemap.js

export default function decorate(block) {
  const container = document.createElement("div");
  container.classList.add("imagemap-container");
  container.style.position = "relative";

  // 修正: data-image に対応
  const imgUrl = block.dataset.image;
  const altText = block.dataset.alt || "";

  // 画像作成
  const img = document.createElement("img");
  img.src = imgUrl;
  img.alt = altText || "DEBUG ALT TEXT";
  container.appendChild(img);

  // クリックエリア要素
  const link = document.createElement("a");
  link.classList.add("clickable-area");
  link.target = "_blank";
  container.appendChild(link);

  block.innerHTML = "";
  block.appendChild(container);

  // 更新関数
  function updateArea() {
    const x = parseFloat(block.dataset.areaX) || 0;
    const y = parseFloat(block.dataset.areaY) || 0;
    const w = parseFloat(block.dataset.areaWidth) || 100;
    const h = parseFloat(block.dataset.areaHeight) || 100;
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

  // 初期表示
  updateArea();

  // Universal Editor 編集画面で変更されたときに反映
  const observer = new MutationObserver(updateArea);
  observer.observe(block, { attributes: true, attributeFilter: [
    "data-area-x", "data-area-y", "data-area-width", "data-area-height", "data-area-href", "data-image", "data-alt"
  ]});
}
