import {
  applyColors,
  c,
  enableAutoColors,
  disableAutoColors,
  enableConsoleOverride,
  disableConsoleOverride,
  enableStdoutOverride,
  disableStdoutOverride,
  ColoredOutputStream,
  color,
  enableStringPrototypeExtension,
} from "..";

console.log(color`\n§white|bgBlue|bold: chromark examples §\n`);

// 1) Basic usage
console.log(applyColors("Hello §green:world§!"));
console.log(c("§yellow|bold:warning§: disk space low"));

// 2) Nested styles and transforms
console.log(applyColors("§red:bold outer §green|underline:inner§ back§"));
console.log(applyColors("§blue|title:my awesome title§"));
console.log(applyColors("§magenta|truncate=12:very long message here§"));

// 3) Automatic overrides for console and stdout
enableAutoColors({ console: true, stdout: true });
console.log("auto §cyan:colors§ on console");
process.stdout.write("auto §yellow:colors§ on stdout\n");
disableAutoColors();

// 4) Dedicated overrides (manual control)
enableConsoleOverride();
console.log("§green:console override§ active");
disableConsoleOverride();

enableStdoutOverride();
process.stdout.write("§blue:stdout override§ active\n");
disableStdoutOverride();

// 5) Stream wrapper
const out = new ColoredOutputStream();
out.write("§white|bgMagenta:stream§ write\n");
out.log("stream log: §red:error§, §green:ok§");

// 6) Template literal tag
const username = "Ada";
console.log(color`Hello §yellow:${username}§! Welcome back.`);

// 7) Optional String prototype extension
enableStringPrototypeExtension();
console.log("§grey:prototype§ §green:works§".color());

// 8) Transforms gallery
console.log("\n§white|bgBlue: transforms §\n".color());
console.log(color`upper: §green|upper:success§`);
console.log(color`lower: §red|lower:ERROR§`);
console.log(color`capitalize: §blue|capitalize:my text§`);
console.log(color`title: §yellow|title:my important title§`);
console.log(color`camel: §magenta|camel:my example text§`);
console.log(color`kebab: §cyan|kebab:MyExampleText§`);
console.log(color`snake: §white|snake:MyExampleText§`);
console.log(color`reverse: §grey|reverse:reverse§`);
console.log(color`repeat: §green|repeat=3:test§`);
console.log(color`pad: §red|pad=5:pad§`);
console.log(color`truncate: §magenta|truncate=10:this is a very long text§`);