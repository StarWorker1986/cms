const blocks = [
    "article", "aside", "details", "div", "dt", "figcaption", "footer",
    "form", "fieldset", "header", "hgroup", "html", "main", "nav",
    "section", "summary", "body", "p", "dl", "multicol", "dd", "figure",
    "address", "center", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
    "listing", "xmp", "pre", "plaintext", "menu", "dir", "ul", "ol", "li", "hr",
    "table", "tbody", "thead", "tfoot", "th", "tr", "td", "caption"
];

const voids = [
    "area", "base", "basefont", "br", "col", "frame", "hr", "img", "input",
    "isindex", "link", "meta", "param", "embed", "source", "wbr", "track"
];

const tableCells = ["td", "th"];
const tableSections = ["thead", "tbody", "tfoot"];
const textBlocks = [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "address", "pre", "form",
    "blockquote", "center", "dir", "fieldset", "header", "footer", "article",
    "section", "hgroup", "aside", "nav", "figure"
];
const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];
const listItems = ["li", "dd", "dt"];
const lists = ["ul", "ol", "dl"];
const wsElements = ["pre", "script", "textarea", "style"];

export { blocks, voids, tableCells, tableSections, textBlocks, headings, listItems, lists, wsElements }