import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

export const detectPackageManager = () => {
  if (fs.existsSync(path.resolve(process.cwd(), "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.resolve(process.cwd(), "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  return "npm";
};

export const getPackages = () => {
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

export const resolvePackageJsonPath = (dep: string) => {
  try {
    const basePath = path.resolve(process.cwd(), "node_modules", dep);
    const packageJsonPath = path.join(basePath, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }
    console.error(chalk.red(`[Error] package.json for ${dep} not found at expected path: ${packageJsonPath}`));
    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`[Error] Failed to resolve package.json for ${dep}: ${error.message}`));
    }
    return null;
  }
};

export const getPeerDependencies = (dep: string) => {
  try {
    const packageJsonPath = resolvePackageJsonPath(dep);
    if (!packageJsonPath) {
      console.warn(chalk.yellow(`[Warning] ${dep} does not have a package.json.`));
      return {};
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.peerDependencies || {};
  } catch {
    return {};
  }
};

export const isDependencyUsedTransitively = (
  dep: string,
  allDependencies: { [x: string]: any },
  log: (msg: string) => void,
) => {
  try {
    const packageJsonPath = resolvePackageJsonPath(dep);
    // console.log(chalk.blue(`[isDependencyUsedTransitively] Checking ${packageJsonPath}`));
    if (!packageJsonPath) {
      console.warn(chalk.yellow(`[Warning] ${dep} does not have a package.json.`));
      return {};
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Check if the dependency is a peer dependency for other packages
    for (const installedDep of Object.keys(allDependencies)) {
      const peerDeps = getPeerDependencies(installedDep);
      if (peerDeps[dep]) {
        console.log(chalk.blue(`[Info] ${dep} is a peer dependency of ${installedDep}.`));
        return true;
      }
    }

    // If not a peer dependency, consider it transitively required
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.optionalDependencies,
    };
    for (const transitiveDep of Object.keys(dependencies)) {
      if (allDependencies[transitiveDep]) {
        // console.log(chalk.blue(`[Info] ${dep} is transitively required by ${transitiveDep}.`));
        log(`[Info] ${dep} is transitively required by ${transitiveDep}.`);
        return true;
      }
    }

    // Recursive check for peer dependencies of peer dependencies
    for (const installedDep of Object.keys(allDependencies)) {
      const peerDeps = getPeerDependencies(installedDep);
      if (peerDeps[dep]) {
        const deeperPeerDeps = getPeerDependencies(dep);
        for (const deeperDep of Object.keys(deeperPeerDeps)) {
          if (allDependencies[deeperDep]) {
            // console.log(chalk.blue(`[Info] ${dep} is indirectly required by ${installedDep} via ${deeperDep}.`));
            log(`[Info] ${dep} is indirectly required by ${installedDep} via ${deeperDep}.`);
            return true;
          }
        }
      }
    }

    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
};
