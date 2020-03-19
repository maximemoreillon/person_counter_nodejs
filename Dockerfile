FROM node:10
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 7373
CMD [ "node", "person_counter.js" ]
