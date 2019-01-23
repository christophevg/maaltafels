import datetime

from flask import request

import flask_restful
from flask_restful import Resource

from maaltafels import server, authenticated, db

api    = flask_restful.Api(server)

class Results(Resource):
  @authenticated
  def post(self):
    result = request.get_json()
    result["_ts"] = datetime.datetime.now()
    result["_user"] = request.authorization.username
    db.results.insert_one(result);

api.add_resource(Results, "/api/results")
