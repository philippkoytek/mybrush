
/*http://tristen.ca/hcl-picker/#/hcl/15/0.95/EE8397/CA996D*/
var colorA = ['#BF6E7E','#B5728E','#A4789B','#8F7FA3','#7786A6','#5F8CA3','#4A909B','#3F928E','#42947D','#4F936C','#60925A','#738E4C','#868A41','#98843D','#A97E3F'];

/*http://jnnnnn.blogspot.ca/2015/10/selecting-different-colours-for.html*/
var colorB = ["#0ae77e", "#fee7ff", "#ffe70d", "#0cfbff", "#effeb0", "#9aff02", "#a8e760", "#82e9b3", "#ccfef3", "#06ff54", "#ffe96f", "#ffe8c9", "#d9fd39", "#99ff9c", "#83e9ff", "#03fdbf", "#73e945", "#bee8ba"];
var colorC = ["#94bdff", "#ecd640", "#6cd1cf", "#f701ff", "#0cde66", "#887937", "#feeeac", "#da9848", "#0ad60a", "#fffe4f", "#b66dff", "#ac9f82", "#72be36", "#a87831", "#bfffd7", "#c753bb", "#f8c60e", "#b49201"];
var colorD = ["#05aba2", "#a8feb7", "#fe32e8", "#bfc0ea", "#eab739", "#b56520", "#8c68be", "#fffc77", "#a77f54", "#8659fe", "#ff7ae3", "#9ed5bb", "#09c68b", "#678335", "#3afd66", "#b9d60d", "#0bc0ff", "#b8559e", "#bcb4b0", "#5ccd60"];
//light colors (L > 80)
var lightColors = ["#13dcfe", "#fffe06", "#feba94", "#0bf990", "#ffaefe", "#c9fecd", "#7fff0c", "#ffbe37", "#a9d858", "#e8e6fd", "#02fee1", "#feec91", "#ffb5ca", "#cecab1", "#7bde8d", "#0bff5c", "#b3e914", "#b7fdff", "#d4ce2c", "#95d0ff"];

//http://jnnnnn.github.io/category-colors-constrained.html
// constraint: 40*40 > lab.a*lab.a+lab.b*lab.b && 20*20 > lab.a*lab.a+lab.b*lab.b && 70 < lab.l;
var lightColors2 = ["#5eb6f4", "#fce49a", "#f491a3", "#4bc0a7", "#dca26b", "#e3bafe", "#b8f5ff", "#a6b389", "#b4ffc6", "#feccbf", "#14c5de", "#beccf1", "#cfa4be", "#78fdf2", "#e3f0ca", "#d1c278", "#7dbbbb", "#83c288", "#ffa48f", "#9daaf1", "#ffaad9", "#ffdafe"];

// No unsaturated colours (distance > 30 from a=0,b=0)
var highlightColors = ["#fe5d43", "#0e02fb", "#02ff5e", "#8e39e9", "#fd0128" , "#f701ff"];
var highlightColors2 = ["#0a22ff", "#06ad1a", "#1eff06", "#ff6401", /*"#ff1902",*/ "#fe07a6", "#7202ae"];

var blues = ["#2395ca", "#4c90e4", "#3798d5", "#5696ce", "#2a9bf6", "#3d9de0", "#629bc9", "#31a1f6", "#50a4ce", "#41aaca", "#27aece", "#49aed6", "#04bde9", "#4ec2d5", "#4fcacc", "#47cfe6", "#63d2c9", "#59daef", "#57deec"];
var blues2 = ["#628bfd", "#0e98e3", "#3a96e1", "#309acc", "#5e91f5", "#4696eb", "#4899dd", "#4c9ad4", "#2799ff", "#5697ee", "#619ce1", "#02a4d6", "#53a0d4", "#5a9bff", "#0da5e9", "#639ff5", "#52a3ff", "#37a8f6", "#61a3f5"];

var constants = {
    touchInteraction:false,
    stdColorScale:d3.scale.ordinal().range(["#324bfd"]),
    brushColors:highlightColors2,
    strokeWidth:1.5
};


