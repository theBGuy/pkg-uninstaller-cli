# Pkg-Uninstaller CLI

![NPM Downloads](https://img.shields.io/npm/d18m/pkg-uninstaller-cli)

A lightweight and interactive CLI tool for uninstalling Node.js packages in bulk directly from your `package.json`.

## Features

- Detects installed dependencies from `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies`.
- Supports **npm**, **yarn**, and **pnpm** package managers.
- Batch uninstallation of selected packages for optimal performance.
- Fully interactive command-line interface using `inquirer`.
- Automatically detects the package manager in use.

## Installation

Install the `pkg-uninstaller-cli` globally using npm:

```bash
npm install -g pkg-uninstaller-cli
```

Or using yarn:

```bash
yarn global add pkg-uninstaller-cli
```

## Usage

Currently, the tool has two main commands:

- `pkg-uninstaller uninstall`: Uninstall selected packages interactively.
- `pkg-uninstaller analyze`: Analyze and identify unused dependencies in the project.

### Uninstall Command

Navigate to the project directory containing your package.json file and run the following command:

```bash
pkg-uninstaller uninstall
```

You can also use the shorthand command:

```bash
pkg-u uninstall
```

You can also use the tool without installing it globally by using `npx`:

```bash
npx pkg-uninstaller-cli uninstall
```

#### Example Workflow

1. The tool lists all installed packages (from dependencies, devDependencies, etc.).
2. You select multiple packages to uninstall using an interactive checkbox.
3. The tool detects your package manager (npm or yarn) automatically.
4. Packages are uninstalled in batches of 5 for efficiency.

#### Example Output

```bash
$ pkg-uninstaller uninstall
Detected package manager: npm
? Select packages to uninstall: (Press <space> to select, <a> to toggle all, <i> to invert selection)
❯◉ chalk
 ◉ lodash
 ◉ inquirer
Running: npm uninstall chalk lodash inquirer
Successfully uninstalled: chalk, lodash, inquirer
All batches processed.
```

### Analyze Command

Navigate to the project directory containing your `package.json` file and run the following command:

```bash
pkg-uninstaller analyze
```

You can also use the shorthand command:

```bash
pkg-u analyze
```

You can also use the tool without installing it globally by using `npx`:

```bash
npx pkg-uninstaller-cli analyze
```

#### Options

- `-v, --verbose: Enable verbose logging for detailed output.`

#### Example Workflow

1. The tool analyzes your project and lists all unused dependencies.
2. You can choose to uninstall the unused dependencies interactively.

#### Example Output

```bash
$ pkg-uninstaller analyze
The following dependencies appear to be unused:
- @react-native-community/datetimepicker
- @stream-io/flat-list-mvcp
✔ Would you like to uninstall unused dependencies? Yes
Detected package manager: npm
Running: npm uninstall @react-native-community/datetimepicker @stream-io/flat-list-mvcp
Successfully uninstalled: @react-native-community/datetimepicker @stream-io/flat-list-mvcp
All batches processed.
```

<!-- ## Options

Currently, the tool has two main commands:

- `pkg-uninstaller uninstall`: Uninstall selected packages interactively.
- `pkg-uninstaller analyze`: Analyze and identify unused dependencies in the project. -->

## Configuration File

You can use a configuration file named .pkg-uninstaller.json to specify dependencies to ignore during the analysis.

### Configuration Format

Create a `.pkg-uninstaller.json` file in the root of your project with the following format:

```json
{
  "ignoreDependencies": ["dependency1", "dependency2"]
}
```

Example Configuration

```json
{
  "ignoreDependencies": [
    "expo-build-properties",
    "expo-dev-client",
    "expo-system-ui",
    "patch-package"
  ]
}
```

The tool will automatically read the `.pkg-uninstaller.json` file and ignore the specified dependencies during the analysis.

## Requirements

- Node.js v14.0.0 or higher
- npm or yarn installed

## Visual Studio Code Extension

There is also a Visual Studio Code extension version of this project available. You can find it at:

- GitHub: https://github.com/theBGuy/vs-pkg-uninstaller
- Visual Studio Marketplace: https://marketplace.visualstudio.com/items?itemName=theBGuy.pkguninstaller

## How It Works

1. Reads the package.json in the current working directory.
2. Detects installed packages across all dependency types.
3. Provides an interactive interface for selecting packages.
4. Executes uninstallation commands in batches to enhance performance.

## Future Improvements

Planned features include:

- Undo Uninstall: Restore recently uninstalled packages.
- Search and Filter: Easily search for packages by name before selecting.
- Custom Batch Sizes: Allow users to configure batch sizes for uninstallation.
- Progress Indicators: Display progress bars for ongoing tasks.

## Contributing

Contributions are welcome! Feel free to fork the repository and open a pull request with your improvements.

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Submit a pull request explaining your changes.

## License

This project is licensed under the MIT License.
