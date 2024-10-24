import Tree from "./tree.js";

const taxonomyUrl =
  "https://raw.githubusercontent.com/patcg-individual-drafts/topics/refs/heads/main/taxonomy_v2.md";

const loadTaxonomy = async () => {
  const response = await fetch(taxonomyUrl);
  const taxonomy = await response.text();
  return taxonomy;
};

const taxonomy = await loadTaxonomy();

const treeConfig = {
  width: 2000,
};

const render = async () => {
  let chart = await Tree(taxonomy, treeConfig)
  const node = document.getElementById("root");
  node.appendChild(chart);
};

render();
