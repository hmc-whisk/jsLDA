# jsLDA

An implementation of latent Dirichlet allocation in javascript by WHISK Lab at
Harvey Mudd College. This version is an adaptation of David Mimno's
[original jsLDA](http://mimno.infosci.cornell.edu/jsLDA/jslda.html). 

## Status

This repository is being actively developed and maintained.

## Installation

First, clone the repo 

```bash
git clone git@github.com:hmc-whisk/jsLDA.git
cd jsLDA
```

Then, install all dependencies 

```bash 
yarn

# using npm (not recommended)
npm i
```

If you don't have `yarn` installed but do have `npm`, you can install it by
`npm i -g yarn`. `yarn` is much faster than `npm`.

## Running the code

To run a development version of the code locally
```bash
yarn start

# or, for npm 
npm run start
```

To build a release version of the code 
```bash
yarn build

# or, for npm
npm run build
```

## Deploying the code

If you have access to a server under cs.hmc.edu, you can deploy a copy of 
the code using the deploy script (requires bash and rsync, so if you are using 
Windows you probably should run this under WSL)

```bash 
yarn deploy <your-hmc-username>

# or, for npm
npm run deploy <your-hmc-username>
```

The code will then be live under www.cs.hmc.edu/~your-hmc-username/jsLDA/.
