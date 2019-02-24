FROM node

WORKDIR /naivechain
ADD package.json /naivechain/

RUN npm i

ADD main.js /naivechain/

EXPOSE 3001
EXPOSE 6001

ENTRYPOINT PEERS=$PEERS npm run dev