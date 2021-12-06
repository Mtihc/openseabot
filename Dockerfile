FROM node:16

WORKDIR /usr/src/app

# install nvm
SHELL [ "/bin/bash", "-l", "-c" ]
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

# use specific node version
COPY .nvmrc ./
RUN nvm use

# install the app
COPY package.json \
     tsconfig.json \
     yarn.lock \
     ./

RUN yarn install
COPY ./src ./src

CMD [ "yarn", "run", "process-asset-events" ]
