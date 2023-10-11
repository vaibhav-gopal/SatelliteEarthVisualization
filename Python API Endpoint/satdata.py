import ephem #calculating coordinates from sat data
from pyproj import Transformer #converting b/n coordinate systems
import json #for json files
from datetime import date #getting current date
import math
import filecmp # compare local "cached" file with file from api
import requests # get api request
import pathlib # delete file

sattleurl = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
spacetleurl = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle"
sattlename = "sat-tle.txt"
spacetlename = "space-tle.txt"
satjsonname = "finalsatdata.json"
spacejsonname = "finalspacedata.json"

#lines from files
sat = []
space = []

#json objects
satdata = []
spacedata = []

#convert from degrees, minutes, seconds to degrees
def dmsToDeg(string):
    deg, min, sec = str(string).split(':')
    result = (float(deg) + (float(min) / 60.0) + (float(sec) / (60.0 * 60.0)))
    return result


def calculateSatSpace():
    #open and read files
    with open(sattlename, "r") as satfs, open(spacetlename, "r") as spacefs:
        sat = satfs.readlines()
        space = spacefs.readlines()
        satfs.close()
        spacefs.close()

    #remove newlines from files
    for i in range(len(sat)):
        sat[i] = sat[i].strip()
    for i in range(len(space)):
        space[i] = space[i].strip()


    print("Loading satellite data")
    # calculate satellite data
    for i in range(len(sat) // 3):
        line1 = sat[i*3]
        line2 = sat[(i*3)+1]
        line3 = sat[(i*3)+2]
        obj = ephem.readtle(line1, line2, line3) #read tle data
        tddate = date.today().strftime("%Y/%M/%D")
        obj.compute(tddate) #compute satellite location based on todays date
        # print('%s %s %s' % (obj.sublong, obj.sublat, obj.elevation)) #measured in longitute, latitute and meters for elevation
        # print('Given: %f %f %f' % (dmsToDeg(obj.sublong), dmsToDeg(obj.sublat), obj.elevation))
        trans_GPS_to_XYZ = Transformer.from_crs(4979, 4978, always_xy=True) #two numbers here indicate the type of coordinate system we are converting to (geodetic GPS to geocentric cartesian)
        (long, lat) = (dmsToDeg(obj.sublong), dmsToDeg(obj.sublat))
        (x,y,z) = trans_GPS_to_XYZ.transform(long, lat, obj.elevation) #this calculation might take some time
        (xs, ys, zs) = (x / 1000000, y / 1000000, z / 1000000)
        dist = math.sqrt((xs ** 2) + (ys ** 2) + (zs ** 2))
        # print('Output: %f %f %f' % (x, y, z))
        satdata.append({
            'NAME': line1,
            'CATALOGNUMBER': line2[2:7], #satellite catalog number (NORAD)
            'CLASS': line2[7], #U: unclassified, C: classified, S: Secret
            'LAUNCHYEAR': line2[9:11], #last 2 digits of launch year
            'LAUNCHNUMBER': line2[11:14], #launch number of the year
            'LAUNCHPIECE': line2[14:17], #piece of the launch
            'X': x,
            'Y': y,
            'Z': z,
            'XS': xs,
            'YS': ys,
            'ZS': zs,
            'DIST': dist,
            'LONG': long,
            'LAT': lat,
            'ELEVATION': obj.elevation,
            'TYPE': 'Satellite'
        })
    print("Finished loading satellite data")

    print("Loading space station data")
    #calculate space station data
    for i in range(len(space) // 3):
        line1 = space[i*3]
        line2 = space[(i*3) + 1]
        line3 = space[(i*3) + 2]
        obj = ephem.readtle(line1, line2, line3)
        tddate = date.today().strftime("%Y/%M/%D")
        obj.compute(tddate)
        # print('%s %s %s' % (obj.sublong, obj.sublat, obj.elevation))
        # print('Given: %f %f %f' % (dmsToDeg(obj.sublong), dmsToDeg(obj.sublat), obj.elevation))
        trans_GPS_to_XYZ = Transformer.from_crs(4979, 4978, always_xy=True) #two numbers here indicate the type of coordinate system we are converting to (geodetic GPS to geocentric cartesian)
        (long, lat) = (dmsToDeg(obj.sublong), dmsToDeg(obj.sublat))
        (x,y,z) = trans_GPS_to_XYZ.transform(long, lat, obj.elevation) #this calculation might take some time
        (xs, ys, zs) = (x / 1000000, y / 1000000, z / 1000000)
        dist = math.sqrt((xs ** 2) + (ys ** 2) + (zs ** 2))
        # print('Output: %f %f %f' % (x / 1000000, y / 1000000, z/ 1000000))
        spacedata.append({
            'NAME': line1,
            'CATALOGNUMBER': line2[2:7], #satellite catalog number (NORAD)
            'CLASS': line2[7], #U: unclassified, C: classified, S: Secret
            'LAUNCHYEAR': line2[9:11], #last 2 digits of launch year
            'LAUNCHNUMBER': line2[11:14], #launch number of the year
            'LAUNCHPIECE': line2[14:17], #piece of the launch
            'X': x,
            'Y': y,
            'Z': z,
            'XS': xs,
            'YS': ys,
            'ZS': zs,
            'DIST': dist,
            'LONG': long,
            'LAT': lat,
            'ELEVATION': obj.elevation,
            'TYPE': 'Station'
        })
    print("Finished loading space station data")

    # print(satdata[0], spacedata[0])

    #convert array/dicts to json objects
    jsonsatdata = json.dumps(satdata)
    jsonspacedata = json.dumps(spacedata)

    #write json into a file
    # NOTE: satellite and space data is sorted by earliest launch (first) to latest launch (last)
    with open(satjsonname, "w") as satfs, open(spacejsonname, "w") as spacefs:
        satfs.write(jsonsatdata)
        spacefs.write(jsonspacedata)
        satfs.close()
        spacefs.close()

def compareAndReplace(txt, otherFile):
    tempPath = "temporary.txt"
    result = False
    try: 
        with open(tempPath, "w") as tempfs:
            tempfs.write(txt)
            result = filecmp.cmp(tempPath, otherFile)
            if (not result):
                with open(otherFile, "w") as otherfs:
                    otherfs.write(txt)
                    otherfs.close()
            tempfs.close()
    except:
        raise Exception("Error occured during compare and replace")
    return (not result)

def writeText(txt, file):
    try:
        with open(file, "w") as fs:
            fs.write(txt)
            fs.close()
    except:
        raise Exception("Error occured during write to text (validate phase)")


def validateAndRun():
    satFileExists = pathlib.Path(sattlename).is_file()
    spaceFileExists = pathlib.Path(spacetlename).is_file()

    satReq = requests.get(sattleurl)
    spaceReq = requests.get(spacetleurl)

    run = False

    if satReq.ok:
        print("SATURL OK")
        if satFileExists:
            print("SATFILE OK")
            cmp = compareAndReplace(satReq.text, sattlename)
            if (cmp):
                print("SAT NOT EQUAL: ", cmp, " --> RUNNING")
                run = True
        else:
            print("SATFILE NOT FOUND --> RUNNING/UPDATING")
            writeText(satReq.text, sattlename)
            run = True
    else:
        if (not satFileExists):
            raise Exception("Local Satellite data file does NOT exist AND API is not returning OK")
    
    if spaceReq.ok:
        print("SPACEURL OK")
        if spaceFileExists:
            print("SPACEFILE OK")
            cmp = compareAndReplace(spaceReq.text, spacetlename)
            if (cmp):
                print("SPACE NOT EQUAL: ", cmp, " --> RUNNING")
                run = True
        else:
            print("SPACEFILE NOT FOUND --> RUNNING/UPDATING")
            writeText(spaceReq.text, spacetlename)
            run = True
    else:
        if (not spaceFileExists):
            raise Exception("Local Space Station data file does NOT exist AND API is not returning OK")

    if (run):
        calculateSatSpace()

validateAndRun()