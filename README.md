# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.hlx.page/
- Live: https://main--{repo}--{owner}.hlx.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Setup Enviroment for Crosswalk

### 1. Configuring AEM Enviroment in converter.yaml

| Field | Description | Example |
|-------|-------------|---------|
| origin | The url of the origin to fetch the content from. | `origin: https://aem.live` |
| suffix<sup>*</sup> | A suffix to append on origin urls, when there is no extension yet. This may be used if the origin requires an extension like `.html` to render. | `suffix: .html` |
| liveUrls<sup>*</sup> | A list of public urls used by the origin. Absolute links with any of these urls will be made domain-relative during the conversion. | `liveUrls:`<br>`  - https://www.aem.live`<br>`  - https://www-stage.aem.live` |
| multibranch<sup>*</sup> | Configuration for multi branch support, see below. | `multibranch`<br>`  - owner: <owner>`<br>`  - repo: <repo>` |

(*) optional

### 2. Including Path & Mapping

* Use [paths.yaml](./paths.yaml) file to configure the paths allowed for crosswalk and mapping URLs. 
* By default, forms available under /content/forms/af/ are available on root of Edge Delivery.

## Local development

### Authorization

For AEM Author origin requires authorization it is possible to specify the credentials for the local converter in various ways:

- **Local Environment** - Set AEM_USER and AEM_PASSWORD environment variables to add a basic Authorization header to the origin request.
- **Cloud Environment** - Set a AEM_TOKEN environment variable to add a bearer Authorization header to the origin request.
Add a Authorization header to the request using a browser extension. The header will be passed through to the origin.

For (1) and (2) it is possible to create a .env file in the project root with the environment variables which will be read with using dotenv/config when starting the converter.

### Starting Convertor

```sh
npm run start
```

* Opens your browser at `http://localhost:3030`

### Starting Edge Delivery 

1. Ensure [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) is added to the repository.
1. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: 
```sh 
aem up
``` 
* Opens your browser at `http://localhost:3000`
* Open the `{repo}` directory in your favorite IDE and start coding :)



