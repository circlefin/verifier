# Verification Service

The Verification Service is built in TypeScript.

## Getting Started

### Requirements

- Node.js
- PostgreSQL

### Quick Start

To get started quickly, simply run:

```sh
npm run setup
```

This will install dependencies, create and migrate the development database, and compile test solidity contracts. At that point you can simply run the server.

### Installation

```sh
npm install
```

### Environment Variables

In local development, environment variables are stored in an `.env`, which is generated with the `npm run setup` command. This file is not committed to version control and is safe for storing local environment settings.

For a production deployment, the following environment variables must be set:

- `DATABASE_URL`: A postgres connection string connecting to the database.
- `TRUSTED_ISSUERS`: A regexp of trusted issuers (for example: `^did:web:circle.com$`)
- `VERIFIER_PRIVATE_KEY`: A private key for signing Verification Results
- `NODE_ENV`: The node environment, should be `production`
- `HOST`: the host where this app is located. For example: `https://verifier.circle.com`
- `PORT`: the port where this app will listen.

NOTE: these variables are also defined in the `.env.example` file.

### Building the project

This project is written in Typescript and uses tsc to compile the code to the `./dist` directory.

To build the project, run the following command:

```sh
npm run build
```

### Production

1. Ensure the proper [environment variables are set](#environment-variables).
2. Then you should [build the app](#building-the-project). (`npm run build`)
3. Ensure the [production database is migrated](#migrate-the-database-in-production). (`npx prisma migrate deploy`)
4. Finally, run the server: `npm start`

### Development

You do not need to rebuild the project when developing, instead we use [nodemon](https://nodemon.io/) for automatic recompilation.

To run the project in development mode, run the following command:

```sh
npm run dev
```

### Database

This project uses [Prisma](https://www.prisma.io/) to access PostgreSQL and manage migrations.

#### Migrate the database in development

```sh
npx prisma migrate dev
```

#### Migrate the database in production

```sh
npx prisma migrate deploy
```

#### Viewing the database

```sh
npx prisma studio
```


#### Creating a new migration

You will need to make sure the DB_USER has the `CREATEDB` role. Easiest way is to recreate the DB and assign the user the role in `create-db.js`.

```sh
npx prisma migrate dev --create-only
```

### Linting the codebase

This project uses ESLint to lint the codebase. It is set up to use the following configurations:

| Configuration                                                           | Description                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| [eslint:recommended](https://eslint.org/docs/rules/)                    | The recommended rules for ESLint                              |
| [@typescript-eslint/recommended](https://typescript-eslint.io/rules/)   | The recommended rules for TypeScript, with type-aware linting |
| [import/recommended](https://github.com/import-js/eslint-plugin-import) | The recommended rules for `eslint-plugin-import`              |

To lint the codebase with `eslint`, run the following command:

```sh
npm run lint
```

To auto-fix as many issues as possible, run the following command:

```sh
npm run lint -- --fix
```

### Code style

This project is configured to use [Prettier](https://prettier.io) for consistent code styles. Prettier is configured to use double quotes, no semicolons (other than where required), and no trailing commas.

To format the codebase with Prettier, run the following command:

```sh
npm run format
```

### Visual Studio Code

The project has a set of recommended VSCode settings and extensions to automatically format and lint the codebase while you are developing. When opening the project in VSCode, you'll be prompted to install the recommended extensions. It is highly recommended that you install these extensions.

The recommended extensions are:

| Extension                                                                                   | Description                             |
| ------------------------------------------------------------------------------------------- | --------------------------------------- |
| [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Automatic linting with ESLint           |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)      | Automatic code formatting with Prettier |

And the default settings are:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Testing

The project is configured to use [Jest](https://jestjs.io/) for testing. The tests live in the `./test` directory, and
coverage reports are output to the `./coverage` directory.

To run the test suite, run the following command:

```sh
npm test
```

After tests are run, you can examine the coverage report by opening the `./coverage/lcov-report/index.html` file.

```sh
open ./coverage/lcov-report/index.html
```

## Continuous Integration

Github Actions are set up to run whenever code is merged or pull requested into the `main` branch.

The Github Actions are located in `.github/workflows`.

In order to test the verifier package, the verite package must be built and the prisma migrations run.

## API Endpoints

See [docs/API.md](https://github.com/circlefin/verity-verifier/tree/master/docs/API.md)

## Generating a Verifier Private Key

A verifier is no different than any other Ethereum wallet.

The project comes packaged with an example verifier. The private key is generated with the mnemonic `test test test test test test test test test test test junk` and should not be used.

You will want to generate one according to your company's best practices. The private key is a secret and should be handled accordingly. For deployment, your private key should be added as an [environment variable](https://github.com/circlefin/verity-verifier/tree/master/packages/verifier#environment-variables).

Below is an example of generating a random wallet using ethers:

```sh
> const ethers = require("ethers")
undefined
> const w = ethers.Wallet.createRandom()
undefined
> w._signingKey().privateKey
'0x56d5b6e2a7156cf09b9d0e0c3b94f16627027729e94928326616c0e4424ab20e'
> w.address
'0x1Ba7A47c2AaaDff2a75070440e80BdffCfAdf840'
```
