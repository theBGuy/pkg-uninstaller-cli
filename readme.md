# Pkg-Uninstaller CLI

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

Navigate to the project directory containing your package.json file and run the following command:

```bash
pkg-uninstaller uninstall
```

You can also use the tool without installing it globally by using `npx`:

```bash
npx pkg-uninstaller-cli uninstall
```

## Example Workflow

1. The tool lists all installed packages (from dependencies, devDependencies, etc.).
2. You select multiple packages to uninstall using an interactive checkbox.
3. The tool detects your package manager (npm or yarn) automatically.
4. Packages are uninstalled in batches of 5 for efficiency.

## Example Output

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

## Options

Currently, the tool has one main command:

- `pkg-uninstaller uninstall`: Uninstall selected packages interactively.

## Requirements

- Node.js v14.0.0 or higher
- npm or yarn installed

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
