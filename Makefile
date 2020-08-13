tag:
	git tag ${TAG} -m "${MSG}"
	git push --tags

venv:
	virtualenv -p python3.7 $@

requirements: venv requirements.txt
	. venv/bin/activate; pip install -r requirements.txt > /dev/null

upgrade: requirements
	. venv/bin/activate; pip list --outdated --format=freeze | grep -v '^\-e' | cut -d = -f 1  | xargs -n1 pip install -U

run:
	. venv/bin/activate; gunicorn maaltafels:server

.PHONY: dist docs
