from flask  import render_template
from jinja2 import TemplateNotFound

from maaltafels import __version__, server, authenticated

def render(template, **kwargs):
  try:
    return render_template(template + ".html", version=__version__, **kwargs)
  except TemplateNotFound:
    return render_template("404.html")

@server.route("/")
@authenticated
def render_home():
  return render("index")
