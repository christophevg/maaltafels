__version__ = "1.0.9"

import os

from functools import wraps

from flask import Flask, request, Response

from pymongo import MongoClient

USER = os.environ.get("USERNAME",    "default")
PASS = os.environ.get("PASSWORD",    "default")
DB   = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/maaltafels")

mongo    = MongoClient(DB)
database = DB.split("/")[-1]
db       = mongo[database]

server = Flask(__name__, static_url_path="/media")

def authenticated(f):
  @wraps(f)
  def wrapper(*args, **kwargs):
    auth = request.authorization
    if not auth or auth.username != USER or auth.password != PASS:
      return Response(
        '', 401, { 'WWW-Authenticate': 'Basic realm="maaltafels"' }
      )
    return f(*args, **kwargs)
  return wrapper

import maaltafels.ui
import maaltafels.api
