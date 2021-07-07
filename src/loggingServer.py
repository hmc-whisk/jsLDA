from flask import Flask, request, abort, make_response
import sqlite3

app = Flask("jsLDA-userstudy")


def get_db():
    db = sqlite3.connect("db.sqlite3")
    c = db.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS userstudy (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id CHAR(4),
        data TEXT,
        time DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    c.close()
    return db


@app.route("/", methods = ["PUT", "OPTIONS"])
def index():
    if request.method == "OPTIONS":
        resp= make_response()
        resp.headers["Access-Control-Allow-Origin"]="*" # for debugging
        resp.headers["Access-Control-Allow-Methods"]="PUT"
        return resp
    if not (id := request.form.get("id")):
        abort(status = 401)
    if not (data := request.form.get("data")):
        abort(status = 403)

    db = get_db()
    db.execute("INSERT INTO userstudy (id, data) VALUES (?,?)", (id, data))
    db.commit()
    db.close()
    resp=make_response('',201)
    resp.headers["Access-Control-Allow-Origin"]="*"
    return resp

if __name__ == '__main__':
    app.run(port = 9191, host = '0.0.0.0')
