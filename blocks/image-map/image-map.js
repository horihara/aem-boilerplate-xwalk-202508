// /blocks/image-map/image-map.js

export default function decorate(block) {
  const imgUrl = block.dataset.imageUrl;
  const mapData = block.dataset.mapAreas
    ? JSON.parse(block.dataset.mapAreas)
    : [];

  // 画像要素生成
  const img = document.createElement("img");
  img.src = imgUrl;
  img.alt = block.dataset.alt || "";

  // マップエリアを重ねるコンテナ
  const container = document.createElement("div");
  container.classList.add("image-map-container");
  container.style.position = "relative";
  container.appendChild(img);

  // クリック領域を生成
  mapData.forEach((area) => {
    const link = document.createElement("a");
    link.href = area.href;
    link.target = "_blank";
    link.classList.add("clickable-area");

    Object.assign(link.style, {
      position: "absolute",
      left: `${area.x}%`,
      top: `${area.y}%`,
      width: `${area.width}%`,
      height: `${area.height}%`,
      border: "2px dashed rgba(255,0,0,0.4)",
      cursor: "pointer",
    });

    container.appendChild(link);
  });

  block.innerHTML = "";
  block.appendChild(container);
}
