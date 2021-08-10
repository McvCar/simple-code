
all: install

clear:
	@rm -rf node_modules

publish:
	@rm -rf node_modules
	@npm set registry https://registry.npmjs.org
	@npm publish

install:
	@npm install
	
update:
	@npm update

reinstall:
	@make clear
	@make install