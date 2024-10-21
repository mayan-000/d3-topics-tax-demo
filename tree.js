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
    parts.forEach((part, index) => {
      let child = currentNode.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, children: [] };
        currentNode.children.push(child);
      }
      currentNode = child;
      if (index === parts.length - 1) {
        child.id = id;
      }
    });
  });

  return data;
};

export default async function Tree(
  data,
	subTaxonomyName,
  {
    tree = d3.tree,
    label,
    title,
    link,
    linkTarget = "_blank",
    width = 640,
    height,
    r = 3,
    padding = 1,
    fill = "#C5D1EB",
    stroke = "#92DCE5",
    strokeWidth = 1.5,
    strokeOpacity = 0.4,
    strokeLinejoin,
    strokeLinecap,
    halo = "#fff",
    haloWidth = 3,
    curve = d3.curveBumpX,
  } = {}
) {
	data = await parseTaxonomy(data);
	data = data.children.find((d) => d.name === subTaxonomyName)

  const root = d3.hierarchy(data);

  const descendants = root.descendants();
  const L = label == null ? null : descendants.map((d) => label(d.data, d));

  const dx = 60;
  const dy = width / (root.height + padding);
  tree().nodeSize([dx, dy])(root);

  let x0 = Infinity;
  let x1 = -x0;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  if (height === undefined) height = x1 - x0 + dx * 2;

  if (typeof curve !== "function") throw new Error(`Unsupported curve`);

  const svg = d3
    .create("svg")
    .attr("viewBox", [(-dy * padding) / 2, x0 - dx, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", stroke)
    .attr("stroke-opacity", strokeOpacity)
    .attr("stroke-linecap", strokeLinecap)
    .attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-width", strokeWidth)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      d3
        .link(curve)
        .x((d) => d.y)
        .y((d) => d.x)
    );

  const node = svg
    .append("g")
    .selectAll("a")
    .data(root.descendants())
    .join("a")
    .attr("xlink:href", link == null ? null : (d) => link(d.data, d))
    .attr("target", link == null ? null : linkTarget)
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  node
    .append("circle")
    .attr("fill", (d) => (d.children ? stroke : fill))
    .attr("r", 20)
		.attr('stroke', '#197BBD')
		.attr('stroke-width', 3);

  if (title != null) node.append("title").text((d) => title(d.data, d));

  if (L)
    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? -25 : 25))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("paint-order", "stroke")
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth)
      .text((d, i) => L[i]);

  return svg.node();
}
