start-multiple:
	npm run tsc;
	instance=1 ; while [[ $$instance -le $(i) ]] ; do \
		((hport = h + instance -1)) ; \
		((pport = p + instance -1)) ; \
		forever start -a --uid hb-$$hport-$$pport -e error.log -o server.log src/main.js $$hport  $$pport $$instance $$i ; \
		((instance = instance + 1)) ; \
  done;
	forever list;
stop-multiple:
	forever stopall;
log:
	tail -n 30 -f /Users/juancruz/.forever/hb-$(h)-$(p).log ;
start-single:
	npm run tsc;
	forever start -a --uid hb-$$h-$$p -e error.log -o server.log src/main.js $$h  $$p $$instance $$instances;