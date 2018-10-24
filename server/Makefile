start-multiple:
	npm run tsc;
	instance=1 ; while [[ $$instance -le $(INSTANCES) ]] ; do \
		((hport = HTTP_PORT + instance -1)) ; \
		((pport = P2P_PORT + instance -1)) ; \
		forever start -a --uid hb-$$hport-$$pport -e error.log -o server.log src/main.js $$hport  $$pport $$instance $$INSTANCES ; \
		((instance = instance + 1)) ; \
  done;
	forever list;
stop-multiple:
	forever stopall
