#!/usr/bin/env node

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const { version } = packageJson;
const program = new Command();

const getPackages = () => {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("No package.json found in the current directory."));
    process.exit(1);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const packages = [];
  for (const [type, deps] of Object.entries({
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
    peerDependencies: packageJson.peerDependencies,
    optionalDependencies: packageJson.optionalDependencies,
  })) {
    if (deps) {
      for (const [pkg, version] of Object.entries(deps)) {
        packages.push({
          name: `${pkg} (${type})`,
          value: pkg,
        });
      }
    }
  }
  return packages;
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

const detectPackageManager = () => {
  if (fs.existsSync(path.resolve(process.cwd(), "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.resolve(process.cwd(), "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  return "npm";
};

program.name("pkg-uninstaller").description("A CLI tool to uninstall Node.js packages interactively").version(version);

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
