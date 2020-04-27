FROM ubuntu:18.04

RUN apt-get update && apt-get install -y && \
	apt-get upgrade -y && \
	apt-get install git -y && \
	apt-get install curl wget -y && apt-get install -y && \
	apt-get install gnupg -y && \
	apt-get clean

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
	apt-get install -y nodejs

ENV EMBERVERSION 3.4.4

RUN npm update && \
	npm install -g ember-cli@${EMBERVERSION}

WORKDIR /app

LABEL maxview.version=0.0.10

RUN git clone https://github.com/PharbersDeveloper/max-bi-v2.git && \
	git clone https://github.com/PharbersDeveloper/basic-components.git

WORKDIR /app/basic-components

RUN npm install && \
	npm link

WORKDIR /app/max-bi-v2

RUN rm -rf node_modules && \
	rm package-lock.json && \
	npm cache clear --force && \
	npm install && \
	npm link basic-components

RUN ember b --environment production

EXPOSE 4200

ENTRYPOINT ["ember", "s", "--live-reload=false"]
