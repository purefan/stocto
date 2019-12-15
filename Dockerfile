
FROM ubuntu:18.04

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_11.x  | bash -
RUN apt-get -y install nodejs
RUN npm install

RUN npm ci --only=production

CMD [ "npm", "run", "start" ]