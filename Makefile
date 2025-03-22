
all: build test

node_modules:
	npm install

build: node_modules
	npm run build

test: build
	npm test

clean:
	rm -rf node_modules
	rm -rf out
