import datetime

from bson.objectid import ObjectId

from flask import request, json, make_response
from flask.json import JSONEncoder

import flask_restful
from flask_restful import Resource

from maaltafels import __version__, server, authenticated, db

# customize the Flask Json encoder with support for datetime.date
class CustomJSONEncoder(JSONEncoder):
  def default(self, obj):
    try:
      if isinstance(obj, datetime.date):
        return obj.isoformat()
      iterable = iter(obj)
    except TypeError:
      pass
    else:
      return list(iterable)
    return JSONEncoder.default(self, obj)

server.json_encoder = CustomJSONEncoder

api = flask_restful.Api(server)

# override the default Flask Restful JSON encoding, and use the customized Flask
@api.representation("application/json")
def output_json(data, code, headers=None):
  resp = make_response(json.dumps(data), code)
  resp.headers.extend(headers or {})
  return resp


class Results(Resource):
  @authenticated
  def post(self):
    result = request.get_json()
    result["_ts"] = datetime.datetime.utcnow()
    result["_user"] = request.authorization.username
    result["session"] = ObjectId(result["session"])
    db.results.insert_one(result)

api.add_resource(Results, "/api/results")

class Sessions(Resource):
  @authenticated
  def post(self, id=None):
    session = request.get_json()
    session["_ts_start"] = datetime.datetime.utcnow()
    session["_user"] = request.authorization.username
    return str(db.sessions.insert_one(session).inserted_id)

  @authenticated
  def put(self, id):
    update = request.get_json()
    update["_ts_end"] = datetime.datetime.utcnow()
    db.sessions.update_one({"_id" : ObjectId(id)}, {"$set" : update})

api.add_resource(Sessions,
  "/api/sessions",
  "/api/sessions/<string:id>"
)

class Version(Resource):
  @authenticated
  def get(self):
    return __version__

api.add_resource(Version,
  "/api/version"
)
