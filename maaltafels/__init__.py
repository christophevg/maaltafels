__version__ = "1.1.1"

import logging
logger = logging.getLogger(__name__)

import os

from functools import wraps

from flask import Flask, request, Response

from pymongo import MongoClient

DB   = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/maaltafels")

mongo    = MongoClient(DB)
database = DB.split("/")[-1]
db       = mongo[database]

server = Flask(__name__, static_url_path="/media")

def valid_credentials():
  auth = request.authorization
  if not auth or not auth.username or not auth.password:
    logger.debug("no authentication information for {0}".format(request.full_path))
    return False
  user = db.users.find_one({ "_id" : auth.username })
  if not user:
    logger.debug("unknown user: {0}".format(auth.username))
    return False
  if not auth.password == user["pass"]:
    logger.debug("incorrect password")
    return False
  return True

def authenticated(f):
  @wraps(f)
  def wrapper(*args, **kwargs):
    if not valid_credentials():
      return Response(
        '', 401, { 'WWW-Authenticate': 'Basic realm="maaltafels"' }
      )
    return f(*args, **kwargs)
  return wrapper

import maaltafels.ui
import maaltafels.api
