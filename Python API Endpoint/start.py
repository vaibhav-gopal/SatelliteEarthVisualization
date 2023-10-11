from flask import Flask
from flask_restful import reqparse, Api, Resource

from satdata import satjsonname, spacejsonname

import json

app = Flask(__name__)
api = Api(app)

parser = reqparse.RequestParser()
parser.add_argument('task')
class SatData(Resource):
    def get(self):
        with open(satjsonname, "r") as satfs:
            jsonObj = json.load(satfs)
            satfs.close()
            return jsonObj

class SpaceData(Resource):
    def get(self):
        with open(spacejsonname, "r") as spacefs:
            jsonObj = json.load(spacefs)
            spacefs.close()
            return jsonObj

# See the next.config.js file for the rewrite config (enable accessing flask api endpoints via the nextjs instance / path)
api.add_resource(SatData, '/python/satellites')
api.add_resource(SpaceData, '/python/spacestations')

if __name__ == '__main__':
    app.run(debug=True)