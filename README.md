# PrivateGPT

![Work in progress](https://img.shields.io/badge/Work-In%20Progress-yellow)

![GitHub](https://img.shields.io/github/license/ashtrindade/privategpt-js)

## Contents

-   [How does it works](#how-does-it-works)
    -   [Training](#training)
    -   [Demo](#demo)
-   [How to run](#how-to-run)

## How does it works

### Training

The model comes with trained with capivara.txt by default. To use your data simply add the file to `./src/trainingData/` directory and then run the command below:

```shell
node ./src/utils/ingest.js ./src/trainingData/<your-file>
```

After the ingest, run the app:

```shell
npm start
```

### Demo

soon

## How to run

Clone:

```shell
git clone git@github.com:ashtrindade/privategpt-js.git
```

Install dependêncies:

```shell
npm install
```

Execute:

```shell
docker-compose up --build
```
