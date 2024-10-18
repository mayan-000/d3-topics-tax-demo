const parseTaxonomy = async (text) => {
  const lines = text.trim().split("\n").slice(2);
  const data = { name: "Root", children: [] };

  lines.forEach((line) => {
    const [id, path] = line
      .split("|")
      .slice(1, 3)
      .map((s) => s.trim());
    const parts = path.split("/").filter(Boolean);

    let currentNode = data;
    let child = currentNode.children.find((c) => c.name === parts[0]);
    if (!child) {
      child = { name: parts[0], children: [] };
      currentNode.children.push(child);
    }
  });

  return data;
};

export default async function Pack(
  data,
  {
    value,
    label,
    title,
    link,
    linkTarget = "_blank",
    width = 640,
    height = 400,
    margin = 1,
    marginTop = margin,
    marginRight = margin,
    marginBottom = margin,
    marginLeft = margin,
    padding = 3,
    fill = "#C5D1EB",
    fillOpacity,
    stroke = "#bbb",
    strokeWidth,
    strokeOpacity,
  } = {}
) {
  data = await parseTaxonomy(data);
  const root = d3.hierarchy(data);

  value == null ? root.count() : root.sum((d) => Math.max(0, value(d)));

  const descendants = root.descendants().slice(1);
  const leaves = descendants.filter(
    (d) => !d.children || d.children.length === 0
  );
  leaves.forEach((d, i) => (d.index = i));
  const L = label == null ? null : leaves.map((d) => label(d.data, d));
  const T = title == null ? null : descendants.map((d) => title(d.data, d));

  d3
    .pack()
    .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
    .padding(padding)(root);

  const svg = d3
    .create("svg")
    .attr("viewBox", [-marginLeft, -marginTop, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle");

  let distance = 0;
  const distanceStore = [];
  let currentIdx = 0;
  let x = 576;
  let y = 500;

  while (currentIdx < descendants.length) {
    if (distance === 0) {
      distanceStore.push({ x, y });
      currentIdx++;
      distance++;
      continue;
    }

    for (let xi = 0; xi <= distance; xi++) {
      const yj = distance - xi;
      let newX = x;
      let newY = y;

      newX = x + 180 * xi;
      newY = y + 180 * yj;
      distanceStore.push({ x: newX, y: newY });
      currentIdx++;

      newX = x - 180 * xi;
      newY = y - 180 * yj;
      distanceStore.push({ x: newX, y: newY });
      currentIdx++;

      newX = x - 180 * xi;
      newY = y + 180 * yj;
      distanceStore.push({ x: newX, y: newY });
      currentIdx++;

      newX = x + 180 * xi;
      newY = y - 180 * yj;
      distanceStore.push({ x: newX, y: newY });
      currentIdx++;
    }

    distance++;
  }

  const node = svg
    .selectAll("a")
    .data(descendants)
    .join("a")
    .attr("xlink:href", link == null ? null : (d, i) => link(d.data, d))
    .attr("target", link == null ? null : linkTarget)
    .attr("transform", (_, i) => {
      const { x, y } = distanceStore[i];
      return `translate(${x}, ${y})`;
    });

  node
    .append("circle")
    .attr("fill", (d) => (d.children ? "#fff" : fill))
    .attr("fill-opacity", (d) => (d.children ? null : fillOpacity))
    .attr("stroke", (d) => (d.children ? stroke : null))
    .attr("stroke-width", (d) => (d.children ? strokeWidth : null))
    .attr("stroke-opacity", (d) => (d.children ? strokeOpacity : null))
    .attr("r", (d) => 80);

  if (T) node.append("title").text((d, i) => T[i]);

  if (L) {
    const uid = `O-${Math.random().toString(16).slice(2)}`;

    const leaf = node.filter(
      (d) => (!d.children || d.children.length === 0) && L[d.index] != null
    );

    leaf
      .append("clipPath")
      .attr("id", (d) => `${uid}-clip-${d.index}`)
      .append("circle")
      .attr("r", (d) => 80);

    leaf
      .append("text")
      .attr(
        "clip-path",
        (d) => `url(${new URL(`#${uid}-clip-${d.index}`, location)})`
      )
      .selectAll("tspan")
      .data((d) => `${L[d.index]}`.split(/\n/g))
      .join("tspan")
      .attr("x", 0)
      .attr("y", (d, i, D) => `${i - D.length / 2 + 0.85}em`)
      .attr("fill-opacity", (d, i, D) => (i === D.length - 1 ? 0.7 : null))
      .text((d) => d);
  }

  return svg.node();
}
