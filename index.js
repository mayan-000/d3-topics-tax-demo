import Pack from "./circle.js";
import Tree from "./tree.js";

const taxonomyUrl =
  "https://raw.githubusercontent.com/patcg-individual-drafts/topics/refs/heads/main/taxonomy_v2.md";

const loadTaxonomy = async () => {
  const response = await fetch(taxonomyUrl);
  const taxonomy = await response.text();
  return taxonomy;
};

const taxonomy = await loadTaxonomy();

const packConfig = {
  value: (d) => d.size,
  label: (d, n) => [...d.name.split(/(?=[A-Z][a-z])/g)].join("\n"),
  title: (d, n) =>
    `${n
      .ancestors()
      .reverse()
      .map(({ data: d }) => d.name)
      .join(".")}\n${n.value.toLocaleString("en")}`,
  link: (d, n) => `#${d.name.replace(/\s/g, "-")}`,
  width: 1152,
  height: 1152,
};

const treeConfig = {
  label: (d) => d.name,
  title: (d, n) =>
    `${n
      .ancestors()
      .reverse()
      .map((d) => d.data.name)
      .join(".")}`,
  link: (d, n) => "",
  width: 2000,
};

const hash = window.location.hash
  ? window.location.hash.slice(1).split("-").join(" ")
  : "";

let chart = hash
  ? await Tree(taxonomy, hash, treeConfig)
  : await Pack(taxonomy, packConfig);
document.getElementById("root").appendChild(chart);
