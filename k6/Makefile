.DEFAULT_GOAL := build
ifeq (, $(shell which node))
	NODE_INSTALLED=false
else
	NODE_INSTALLED=true
endif

.PHONY: check-node-installed
check-node-installed:
	@$(NODE_INSTALLED) || echo NodeJS is not installed. Call "make install" to install

.PHONY: build
build: clean check-node-installed node-modules
	npm run bundle

.PHONY: build-dev
build-dev: export WEBPACK_DEVTOOL=source-map
build-dev: build

AWS_ACCOUNT_ID:=$(shell aws sts get-caller-identity --query "Account" --output text)
.PHONY: run
run: build
	AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) ./run-test.sh

.PHONY: run-dev
run-dev: export WEBPACK_DEVTOOL=source-map
run-dev: run

.PHONY: node-modules
node-modules:
	npm install

.PHONY: clean
clean:
	rm -rf dist

GOPATH_DIR = ${GOPATH}
ifeq ($(GOPATH_DIR),)
	GOPATH_DIR := ~/go
endif
.PHONY: install
install:
	brew install node@18
	brew install k6
	go install go.k6.io/xk6/cmd/xk6@latest
	(cd $(GOPATH)/bin && ./xk6 build --with github.com/grafana/xk6-sql --with github.com/mridehalgh/xk6-sqs)

.PHONY: style
style: check-node-installed node-modules
	npm run style
