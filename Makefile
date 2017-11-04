NODE_MODULES_BINARIES = ./node_modules/.bin
BUILD_DIR = ./build

BABEL = $(NODE_MODULES_BINARIES)/babel
BABEL_WATCH = $(NODE_MODULES_BINARIES)/babel-watch
MOCHA = $(NODE_MODULES_BINARIES)/mocha
STANDARD = $(NODE_MODULES_BINARIES)/standard
SNAZZY = $(NODE_MODULES_BINARIES)/snazzy

MAINJS_FILE = server/index

dev:
		DEBUG= $(BABEL_WATCH) --watch . src/$(MAINJS_FILE)
start:
	node $(BUILD_DIR)/$(MAINJS_FILE)
build:
	make clean
	mkdir -p $(BUILD_DIR)
	$(BABEL) ./src -s -D -d $(BUILD_DIR)
clean:
	rm -rf $(BUILD_DIR)
code-style:
	$(STANDARD) --fix --verbose ./src | $(SNAZZY)

test:
	make code-style && $(MOCHA) --require babel-register ./tests/**/*.spec.js

unit:
	make code-style && $(MOCHA) --require babel-register ./tests/unit/*.spec.js

.PHONY: dev build clean code-style test unit
