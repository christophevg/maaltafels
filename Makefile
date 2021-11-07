tag:
	git tag ${TAG} -m "${MSG}"
	git push --tags

.python-version:
	@pyenv virtualenv 3.8.12 $$(basename ${CURDIR}) > /dev/null 2>&1 || true
	@pyenv local $$(basename ${CURDIR})
	@pyenv version

requirements: .python-version requirements.txt
	pip install -r requirements.txt

upgrade: requirements
	pip list --outdated --format=freeze | grep -v '^\-e' | cut -d = -f 1  | xargs -n1 pip install -U

run: requirements
	gunicorn maaltafels:server

.PHONY: dist docs
