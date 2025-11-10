// /blocks/image-map/image-map.js

export default function decorate(block) {
  const imgUrl = block.dataset.imageUrl;
  const altText = block.dataset.alt || "";

  // 単一クリックエリアのプロパティを取得
  const x = parseFloat(block.dataset.areaX);
  const y = parseFloat(block.dataset.areaY);
  const w = parseFloat(block.dataset.areaWidth);
  const h = parseFloat(block.dataset.areaHeight);
  const href = block.dataset.areaHref;

  // コンテナ
  const container = document.createElement("div");
  container.classList.add("image-map-container");
  container.style.position = "relative";

  // 画像
  const img = document.createElement("img");
  img.src = imgUrl;
  img.alt = altText;
  container.appendChild(img);

  // クリックエリアが有効なら描画
  if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h) && href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.classList.add("clickable-area");

    Object.assign(link.style, {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      border: "2px dashed rgba(255,0,0,0.4)",
      cursor: "pointer"
    });

    container.appendChild(link);
  }

  block.innerHTML = "";
  block.appendChild(container);
}
