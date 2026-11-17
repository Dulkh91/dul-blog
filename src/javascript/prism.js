import Prism from "prismjs";

// Import Swift language
import "prismjs/components/prism-swift";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-typescript";


// Import Theme
import "prismjs/themes/prism-tomorrow.css";

document.addEventListener("DOMContentLoaded", () => {
  Prism.highlightAll();
});