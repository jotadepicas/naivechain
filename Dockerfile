FROM node

WORKDIR /naivechain
ADD package.json /naivechain/

RUN npm i

ADD main.js /naivechain/
ADD src /naivechain/src/

EXPOSE 3001
EXPOSE 6001

ENTRYPOINT PEERS=$PEERS npm run dev