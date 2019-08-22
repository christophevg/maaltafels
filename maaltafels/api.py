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
  def get(self):
    return [result for result in db.results.aggregate([
      {
        "$match": {
          "_user" : request.authorization.username
        }
      },
      {
        "$project": {
          "year"      : { "$year"      : "$_ts" },
          "month"     : { "$month"     : "$_ts" },
          "dayOfMonth": { "$dayOfMonth": "$_ts" },
          "correct"   : { "$eq": [ "$answer", "$expected" ] },
          "time"      : "$time",
        }
      },
      {
        "$group": {
          "_id": {
            "$dateFromParts" : {
              "year" : "$year",
              "month": "$month",
              "day"  : "$dayOfMonth"
            }
          },
          "questions": { "$sum": 1 },
          "correct"  : { "$sum": { "$cond": [ "$correct", 1, 0 ] } },
          "time"     : { "$avg": "$time" }
        }
      },
      {
        "$sort": { "_id": -1 }
      },
      {
        "$limit": 7
      }
    ])]

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
  def get(self, id=None):
    return [ result for result in db.sessions.find( {
      "_user": request.authorization.username
    },{
      "start": 1,
      "end" : 1,
      "tables": 1,
      "duration" : 1,
      "_id" : 0
    }).sort( [("start", -1)] ).limit(10)
  ]

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
    db.sessions.update_one({
      "_id" : ObjectId(id),
      "_user": request.authorization.username
    },{
      "$set" : update
    })

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

class Coverage(Resource):
  @authenticated
  def get(self):
    return [ question for question in db.results.aggregate([
      {
        "$match": {
          "_user" : request.authorization.username
        }
      },
      {
        "$group" : {
          "_id" : "$config",
          "total": { "$sum" : 1 },
          "correct": { "$sum": { "$cond": [ { "$eq": [ "$answer", "$expected" ] }, 1, 0 ] } }
        }
      }
    ])]

api.add_resource(Coverage,
  "/api/coverage"
)
