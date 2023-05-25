FROM node:18-alpine

WORKDIR /app/

COPY package*.json ./

RUN npm config set strict-ssl=false \
    && npm install -g npm@9.6.7 \
    && npm install

RUN mkdir models \
    && cd models \
    && wget --no-check-certificate https://gpt4all.io/models/ggml-gpt4all-j-v1.3-groovy.bin \
    && cd ..

COPY . .

RUN npm run ingest

ENTRYPOINT npm start