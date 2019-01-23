import datetime

from bson.objectid import ObjectId

from flask import request

import flask_restful
from flask_restful import Resource

from maaltafels import server, authenticated, db

api = flask_restful.Api(server)

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
