# dex

## Initialization

### TLDR

For non-developers, you can get started using this project quickly by running the following command at the terminal, which downloads and executes the [src/scripts/init.sh](src/scripts/init.sh) script:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/robertbullen/dex/master/src/scripts/init.sh)"
```

### Details

These dependencies must be installed on the system:

| Dependency | Installation | Notes |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | `brew install node` | This is a JavaScript project and Node.js is the runtime used to execute it. |
| [Yarn](https://yarnpkg.com/) | `brew install yarn` | Yarn is a JavaScript dependency manager. |
| [Graphviz](https://graphviz.org/) | `brew install graphviz` | Graphviz is used to generate the org charts. |

Prior to the first invocation, install all JavaScript packages with this command:

```bash
# From the root directory of this project:
yarn install
```

If you would like live YAML validation support in Visual Studio Code, install the [YAML Language Support by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension, and then generate JSON schemas with this command:

```bash
# From the root directory of this project:
yarn build
```

## Usage

Subsequent invocations can invoke the script directly:

```plaintext
Usage: dex.mjs -t=<path/to/template.pptx> -d=<path/to/data.yaml>
-o=<path/to/output/dir/> [-m=<yyyy-mm-dd>] [-r] [-s] [-u=<username>]
[-p=<password>]

Options:
  --version              Show version number                           [boolean]
  --help                 Show help                                     [boolean]
  --interactive                                                  [default: true]
  --meeting-date, -m     The date when the meeting will take place, specified in
                         yyyy-mm-dd format.                             [string]
  --username, -u         The username to use when logging into Salesforce.
                                                                        [string]
  --password, -p         The password to use when logging into Salesforce.
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
```

### Example

```bash
./dex.mjs --template-file=templates/template.pptx --data-dir=data/patterson-companies --output-dir=local/output --preview
```

## Educational Links

-   [Docxtemplater](https://docxtemplater.com/docs/get-started-node/) is the main library powering this utility. It has a free core component and several for-purchase [plugin modules](https://docxtemplater.com/pricing/) available should the need arise. They're expensive enough that they're being avoided for this PoC.
-   [OOXML Hacking: Editing in macOS](https://www.brandwares.com/bestpractices/2015/11/xml-hacking-editing-in-os-x/) explains how to spelunk around a PowerPoint presentation. (PPTX files are really just zipped directories of XML content and assets, so it is possible to unzip the PPTX, search and replace, and then rezip.)
-   [OfficeTalk: Essentials of the Open Packaging Conventions](<https://docs.microsoft.com/en-us/previous-versions/office/office-12/ee361919(v=office.12)>) - This is an old document but it explains the fundamentals of an Open Package, which is what Office documents are, and is still relevant.

## Ideas

-   [ ] Slide showing all GTI integrations
-   [ ] Show Portfolio Status slide, which elaborates on our three product pillars and their presence at the customer

    ```yaml
    # Possible data model
    portfolioHeatMap:
        core:
            color: yellow
            notes:
                - One
                - Two
                - Three

        cloud:
            color: yellow
            notes:
                - Private cloud visibility unknown
                - GigaVUE-VM scheduled for end-of-support
                - V Series presentation cancelled
                - Public cloud visibility unknown

        threatInsight:
            color: red
            notes:
                - ThreatINSIGHT hasn't been explored at Ecolab
    ```

-   [ ] Present deployments on the OSI-like architecture diagram, highlighting the parts that the customer owns
-   [ ] Present locations/sites in tabular format, possibly with the following columns:

    | Site Name     | Site Location   | Site Host    | Using Gigamon |
    | ------------- | --------------- | ------------ | ------------- |
    | Data Center 1 | Chicago, IL     | Sunguard     | Yes           |
    | Data Center 2 | Minneapolis, MN | Self-Managed | Yes           |
    | Branch A      | Duluth, MN      | Self-Managed | No            |
