FROM node:16-alpine

WORKDIR /project

COPY package.json .
COPY package-lock.json .

RUN npm install --legacy-peer-deps

COPY . .

# RUN npm run build

CMD ["npm","run","start"]
