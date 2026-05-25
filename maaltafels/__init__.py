__version__ = "1.2.1"

import logging
import os

LOG_LEVEL = os.environ.get("LOG_LEVEL") or "DEBUG"

logger = logging.getLogger(__name__)

FORMAT = "[%(asctime)s] [%(name)s] [%(process)d] [%(levelname)s] %(message)s"
DATEFMT = "%Y-%m-%d %H:%M:%S %z"

logging.basicConfig(level=logging.DEBUG, format=FORMAT, datefmt=DATEFMT)
formatter = logging.Formatter(FORMAT, DATEFMT)

# adjust gunicorn logger to global level and formatting
gunicorn_logger = logging.getLogger("gunicorn.error")
if gunicorn_logger.handlers:
  gunicorn_logger.handlers[0].setFormatter(formatter)
  gunicorn_logger.setLevel(logging.getLevelName(LOG_LEVEL))

logging.getLogger("gunicorn.error").setLevel(logging.INFO)
if logging.getLogger().handlers:
  logging.getLogger().handlers[0].setFormatter(formatter)

from functools import wraps  # noqa: E402

from flask import Flask, Response, request  # noqa: E402
from pymongo import MongoClient  # noqa: E402
from pymongo.mongo_client import MongoClient as MongoClientType  # noqa: E402

DB = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/maaltafels")
mongo: MongoClientType = MongoClient(DB)
database = DB.split("/")[-1]
if "?" in database:
  database = database.split("?")[0]
db = mongo[database]
logger.info(f"connected to {database} on {DB}")

server = Flask(__name__, static_url_path="/media")


def valid_credentials():
  auth = request.authorization
  if not auth or not auth.username or not auth.password:
    logger.debug(f"no authentication information for {request.full_path}")
    return False
  user = db.users.find_one({"_id": auth.username})
  if not user:
    logger.debug(f"unknown user: {auth.username}")
    return False
  if not auth.password == user["pass"]:
    logger.debug("incorrect password")
    return False
  return True


def authenticated(f):
  @wraps(f)
  def wrapper(*args, **kwargs):
    if not valid_credentials():
      return Response("", 401, {"WWW-Authenticate": 'Basic realm="maaltafels"'})
    return f(*args, **kwargs)

  return wrapper


import maaltafels.api  # noqa: E402
import maaltafels.ui  # noqa: E402,F401
