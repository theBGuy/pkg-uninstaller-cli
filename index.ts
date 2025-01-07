#!/usr/bin/env node

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import chalk from "chalk";
import { Command } from "commander";
import { glob } from "glob";
import inquirer from "inquirer";

import { fileURLToPath } from "node:url";
import { detectPackageManager, getPackages, isDependencyUsedTransitively } from "./utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const { version } = packageJson;
const program = new Command();

const analyzeUnusedPackages = (verbose: boolean) => {
  const log = (message: string) => {
    if (verbose) {
      console.log(chalk.blue(`[Verbose] ${message}`));
    }
  };
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("No package.json found in the current directory."));
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const allDependencies = {
    ...packageJson.dependencies,
    // TODO: more analysis on these types
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  };

  const usedDependencies = new Set();
  const dependencyFileCount = new Map<string, number>();

  const files: string[] = glob.sync("**/*.{js,jsx,ts,tsx}", {
    ignore: ["node_modules/**", "dist/**", "build/**"],
  });

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    try {
      const ast = parse(content, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });

      traverse.default(ast, {
        ImportDeclaration(path: any) {
          const source = path.node.source.value;
          for (const dep of Object.keys(allDependencies)) {
            if (source === dep || source.startsWith(`${dep}/`)) {
              usedDependencies.add(dep);
              dependencyFileCount.set(dep, (dependencyFileCount.get(dep) || 0) + 1);
            }
          }
        },
        CallExpression(path: any) {
          // Handle require() calls
          if (
            path.node.callee.name === "require" &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === "StringLiteral"
          ) {
            const source = path.node.arguments[0].value;
            for (const dep of Object.keys(allDependencies)) {
              if (source === dep || source.startsWith(`${dep}/`)) {
                usedDependencies.add(dep);
                dependencyFileCount.set(dep, (dependencyFileCount.get(dep) || 0) + 1);
              }
            }
          }
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Failed to parse ${file}: ${error.message}`));
      }
    }
  }

  if (verbose) {
    console.log(chalk.blue("Dependency usage count:"));
    for (const [dep, count] of dependencyFileCount.entries()) {
      console.log(`${dep}: ${count} file(s)`);
    }
  }

  // Identify unused dependencies
  const unusedDependencies = Object.keys(packageJson.dependencies).filter((dep) => {
    if (usedDependencies.has(dep)) return false;
    // if (coreDependencies.has(dep)) {
    //     console.log(chalk.yellow(`[Warning] ${dep} is core to your environment and may not appear in imports.`));
    //     return false;
    // }
    if (isDependencyUsedTransitively(dep, allDependencies, log)) {
      return false;
    }
    return true;
  });

  if (unusedDependencies.length === 0) {
    console.log(chalk.green("No unused dependencies found!"));
  } else {
    console.log(chalk.yellow("The following dependencies appear to be unused:"));
    for (const dep of unusedDependencies) {
      console.log(`- ${chalk.red(dep)}`);
    }

    return unusedDependencies;
  }

  return [];
};

const uninstallPackagesBatch = (packages: string[], packageManager: string) => {
  const managerRemoveCmd =
    packageManager === "yarn" ? "yarn remove" : packageManager === "pnpm" ? "pnpm remove" : "npm uninstall";
  const batchSize = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < packages.length; i += batchSize) {
    chunks.push(packages.slice(i, i + batchSize));
  }

  const uninstallChunk = (chunk: string[]) => {
    return new Promise((resolve, reject) => {
      const command = `${managerRemoveCmd} ${chunk.join(" ")}`;

      console.log(chalk.blue(`Running: ${command}`));
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Error: ${error.message}`));
          reject(error);
        } else if (stderr) {
          console.error(chalk.yellow(`Warning: ${stderr}`));
          resolve(stderr);
        } else {
          console.log(chalk.green(`Successfully uninstalled: ${chunk.join(", ")}`));
          resolve(stdout);
        }
      });
    });
  };

  const runBatches = async () => {
    for (const chunk of chunks) {
      try {
        await uninstallChunk(chunk);
      } catch (err) {
        console.error(chalk.red(`Failed to uninstall batch: ${chunk.join(", ")}`));
      }
    }
  };

  runBatches().then(() => {
    console.log(chalk.green("All batches processed."));
  });
};

program.name("pkg-uninstaller").description("A CLI tool to uninstall Node.js packages interactively").version(version);

program
  .command("analyze")
  .description("Analyze and identify unused dependencies in the project")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options) => {
    const unusedDependencies = analyzeUnusedPackages(options.verbose);

    if (unusedDependencies.length > 0) {
      const { removeUnused } = await inquirer.prompt([
        {
          type: "confirm",
          name: "removeUnused",
          message: "Would you like to uninstall unused dependencies?",
          default: false,
        },
      ]);

      if (removeUnused) {
        const packageManager = detectPackageManager();
        uninstallPackagesBatch(unusedDependencies, packageManager);
      }
    }
  });

program
  .command("uninstall")
  .description("Uninstall selected packages from package.json")
  .action(async () => {
    try {
      const packages = getPackages();
      if (packages.length === 0) {
        console.log(chalk.yellow("No packages found to uninstall."));
        return;
      }
      const { selectedPackages } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "selectedPackages",
          message: "Select packages to uninstall:",
          choices: packages,
        },
      ]);
      if (selectedPackages.length === 0) {
        console.log(chalk.yellow("No packages selected for uninstallation."));
        return;
      }
      const packageManager = detectPackageManager();
      console.log(chalk.blue(`Detected package manager: ${packageManager}`));
      uninstallPackagesBatch(selectedPackages, packageManager);
    } catch (error) {
      if (error instanceof Error && "isTtyError" in error) {
        console.error(chalk.red("Prompt couldn't be rendered in the current environment."));
      } else {
        console.error(chalk.red("Prompt was closed forcefully."));
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
