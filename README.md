# dex

This project implements a proof-of-concept for dynamically populating PowerPoint templates with data. Think of it sort of like [Handlebars](https://handlebarsjs.com/) for PowerPoint.

- [dex](#dex)
  - [Initialization](#initialization)
    - [TL;DR](#tldr)
    - [Details](#details)
      - [macOS System Dependencies](#macos-system-dependencies)
      - [JavaScript Packages](#javascript-packages)
      - [Visual Studio Code Extensions](#visual-studio-code-extensions)
  - [Usage](#usage)
    - [Example](#example)
  - [Educational Links](#educational-links)

## Initialization

### TL;DR

For non-developers, you can get your macOS system set up very simply by running the following command at the terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/robertbullen/dex/master/src/scripts/init.sh)"
```

The command downloads and executes the [src/scripts/init.sh](src/scripts/init.sh) script, which then performs all the critical steps in the following section plus downloading this Github project into its own `dex` directory.

### Details

#### macOS System Dependencies

These dependencies must be installed on the system:

| Dependency | Installation | Notes |
| --- | --- | --- |
| [Homebrew](https://brew.sh) | See [website](https://brew.sh). | Used for macOS dependency management. |
| [Node.js](https://nodejs.org/) | `brew install node` | This is a JavaScript project and Node.js is the runtime used to execute it. |
| [Yarn](https://yarnpkg.com/) | `brew install yarn` | Yarn is a JavaScript dependency manager. |
| [Graphviz](https://graphviz.org/) | `brew install graphviz` | Graphviz is used to generate the org charts. |

#### JavaScript Packages

Prior to the first invocation, install all JavaScript packages with this command:

```bash
# From the root directory of this project:
yarn install
```

#### Visual Studio Code Extensions

If you would like live YAML validation support in Visual Studio Code, install the [YAML Language Support by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension, and then generate JSON schemas with this command:

```bash
# From the root directory of this project:
yarn build
```

## Usage

Subsequent invocations can invoke the script directly:

```plaintext
Usage: dex.ts -t=<path/to/template.pptx> -d=<path/to/data.yaml>
-o=<path/to/output/dir/> [-m=<yyyy-mm-dd>] [-r]  [-s]

Interactive Arguments
  --meeting-date  The date when the meeting will take place, specified as
                  'today', 'tomorrow', or in 'yyyy-mm-dd' format.
                                                     [string] [default: "today"]

Noninteractive Arguments
  --data-path, -d        File or directory path containing the customer data to
                         substitute into the template PowerPoint slide deck.
                         When a directory is specified, all JSON, YAML, and
                         JavaScript modules (*.mjs) will be loaded and merged
                         into a single object.               [string] [required]
  --output-dir, -o       Directory path where the generated PowerPoint slide
                         deck will be written; its file name will be created
                         from the customer data.             [string] [required]
  --review, -r           Open the generated PowerPoint slide deck once complete.
                                                      [boolean] [default: false]
  --save-org-charts, -s  Save generated org charts in their intermediate formats
                         (DOT and SVG) for examination.
                                                      [boolean] [default: false]
  --template-file, -t    File path to a template PowerPoint slide deck.
                                                             [string] [required]

Options:
  --version      Show version number                                   [boolean]
  --help         Show help                                             [boolean]
```

### Example

```bash
./dex.ts --template-file=template.pptx --data-path=data.yaml --output-dir=output --review
```

## Educational Links

-   [Docxtemplater](https://docxtemplater.com/docs/get-started-node/) is the main library powering this utility. It has a free core component and several for-purchase [plugin modules](https://docxtemplater.com/pricing/) available should the need arise. They're expensive enough that they're being avoided for this PoC.
-   [OOXML Hacking: Editing in macOS](https://www.brandwares.com/bestpractices/2015/11/xml-hacking-editing-in-os-x/) explains how to spelunk around a PowerPoint presentation. (PPTX files are really just zipped directories of XML content and assets, so it is possible to unzip the PPTX, search and replace, and then rezip.)
-   [OfficeTalk: Essentials of the Open Packaging Conventions](<https://docs.microsoft.com/en-us/previous-versions/office/office-12/ee361919(v=office.12)>) - This is an old document but it explains the fundamentals of an Open Package, which is what Office documents are, and is still relevant.
