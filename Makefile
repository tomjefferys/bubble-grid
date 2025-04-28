
all: build test

node_modules:
	npm install

build: node_modules
	npm run build

test: build
	npx jest

clean:
	rm -rf node_modules
	rm -rf dist
