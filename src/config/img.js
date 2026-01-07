import isProd from "./isProd.js";
import imgProd from "./prod/img.js";
import imgDev from "./dev/img.js";

export default (isProd ? imgProd : imgDev);

