__version__ = "1"

import os
import logging

from flask import Flask

from flask  import render_template, send_from_directory
from flask  import request, Response
from jinja2 import TemplateNotFound

USER = os.environ.get("USERNAME", "default")
PASS = os.environ.get("PASSWORD", "default")

server = Flask(__name__, static_url_path="/media")

def render(template, **kwargs):
  auth = request.authorization
  if not auth or auth.username != USER or auth.password != PASS:
    return Response(
      '', 401, { 'WWW-Authenticate': 'Basic realm="maaltafels"' }
    )
  try:
    return render_template(template + ".html", version=__version__, **kwargs)
  except TemplateNotFound:
    return render_template("404.html")

@server.route("/")
def render_home():
  return render("index")
