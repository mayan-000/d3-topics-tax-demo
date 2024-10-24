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
  { width = 640, fill = "#C5D1EB", stroke = "#92DCE5" } = {}
) {
  data = await parseTaxonomy(data);
  // data = data.children.find((d) => d.name === subTaxonomyName);

  const marginTop = 40;
  const marginRight = 10;
  const marginBottom = 40;
  const marginLeft = 100;

  const root = d3.hierarchy(data);
  const dx = 60;
  let dy = (width - marginRight - marginLeft) / (1 + root.height);

  d3.tree().nodeSize([dx, dy]);
  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, width, dx])
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 20px sans-serif; user-select: none;"
    );

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", stroke)
    .attr("stroke-width", 1.5);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  function update(event, source) {
    const duration = event?.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();
    const maxDepth = nodes.reduce((acc, node) => {
      acc = Math.max(acc, node.depth);

			return acc;
    }, 0);

    dy = (width - marginRight - marginLeft) / (maxDepth + 1);
    d3.tree().nodeSize([dx, dy])(root);

    let left = root;
    let right = root;
    root.eachBefore((node) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + marginTop + marginBottom;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );

    const node = gNode.selectAll("g").data(nodes, (d) => d.id);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    nodeEnter
      .append("circle")
      .attr("r", 15)
      .attr("fill", (d) => {
        if (!d.children && !d._children) {
          return fill;
        } else {
          return "#92DCE5";
        }
      })
      .attr("stroke-width", 3)
      .attr("stroke", "#197BBD");

    nodeEnter
      .append("title")
      .text((d) => (d.data.name ? `Value: ${d.data.name}` : "No value"));

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d._children ? -20 : 20))
      .attr("text-anchor", (d) => (d._children ? "end" : "start"))
      .text((d) => d.data.name)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    const link = gLink.selectAll("path").data(links, (d) => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    link.merge(linkEnter).transition(transition).attr("d", diagonal);

    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;

    if (d.data.name !== "Root") d.children = null;
  });

  update(null, root);

  return svg.node();
}
