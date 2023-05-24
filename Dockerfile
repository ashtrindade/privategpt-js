FROM node:18-alpine

COPY package.json ./

RUN npm install

WORKDIR /home/	    

RUN mkdir models \
    && cd models \
    && wget --no-check-certificate https://gpt4all.io/models/ggml-gpt4all-j-v1.3-groovy.bin \
    && cd ..

COPY . .

CMD ["bash]