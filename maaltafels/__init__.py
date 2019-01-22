__version__ = "1.0.4"

import os
import logging
import json
import datetime

from functools import wraps

from flask import Flask

from flask  import render_template, send_from_directory
from flask  import request, Response
from flask  import make_response
from jinja2 import TemplateNotFound

import flask_restful
from flask_restful import Resource

from pymongo import MongoClient

USER = os.environ.get("USERNAME",    "default")
PASS = os.environ.get("PASSWORD",    "default")
DB   = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/maaltafels")

mongo    = MongoClient(DB)
database = DB.split("/")[-1]
db       = mongo[database]

server = Flask(__name__, static_url_path="/media")
api    = flask_restful.Api(server)

def output_json(data, code, headers=None):
  resp = make_response(json.dumps(data), code)
  resp.headers.extend(headers or {})
  return resp

api.representations = { 'application/json': output_json }

def signed(f):
  @wraps(f)
  def wrapper(self):
    if not has_valid_signature(request.get_json()):
      return abort("invalid signature")
    return f(self)
  return wrapper


def authenticated(f):
  @wraps(f)
  def wrapper(self=None):
    auth = request.authorization
    if not auth or auth.username != USER or auth.password != PASS:
      return Response(
        '', 401, { 'WWW-Authenticate': 'Basic realm="maaltafels"' }
      )
    if self: return f(self)
    return f()
  return wrapper

def render(template, **kwargs):
  try:
    return render_template(template + ".html", version=__version__, **kwargs)
  except TemplateNotFound:
    return render_template("404.html")

@server.route("/")
@authenticated
def render_home():
  return render("index")

class Results(Resource):
  @authenticated
  def post(self):
    logging.info("receiving results")
    result = request.get_json()
    result["_ts"] = datetime.datetime.now().isoformat()
    db.results.insert_one(result);

api.add_resource(Results, "/api/results")
