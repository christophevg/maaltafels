# Maaltafels

> Oefen maaltafels met opvolging.

## Features

- kies welke maaltafels
- tijdopname
- opslag en rapportering van resultaten

## Setup

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

en

Maak een `users` collection aan, met een document per gebruiker. Bv.:

```mongo
> db.users.insertOne({"_id": "default", "pass" : "default"})
{ "acknowledged" : true, "insertedId" : "default" }
> db.users.find().pretty()
{ "_id" : "default", "pass" : "default" }
```
